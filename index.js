const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Contact = require('./models/Contact');

const app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/bitespeed2', { useNewUrlParser: true, useUnifiedTopology: true });

app.post('/identify', async (req, res) => {
    const { email, phoneNumber } = req.body;

    try {
        // Step 1: Find or create the primary contact
        let primaryContact = await findPrimaryContact(email, phoneNumber);
        if (!primaryContact) {
            primaryContact = await createPrimaryContact(email, phoneNumber);
        }

        // Step 2: Find all linked contacts
        const contacts = await findLinkedContacts(primaryContact._id);

        // Step 3: Format the response
        const response = formatResponse(primaryContact, contacts);

        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Helper function to find the primary contact
async function findPrimaryContact(email, phoneNumber) {
    // Find contacts that match either email or phoneNumber
    const matchingContacts = await Contact.find({
        $or: [
            { email: email },
            { phoneNumber: phoneNumber }
        ]
    }).sort({ createdAt: 1 }); // Sort by creation time to get the oldest contact first

    if (matchingContacts.length === 0) {
        return null; // No matching contacts found
    }

    // Find the primary contact among the matching contacts
    let primaryContact = matchingContacts.find(contact => contact.linkPrecedence === 'primary');

    // If no primary contact is found, the oldest contact becomes primary
    if (!primaryContact) {
        primaryContact = matchingContacts[0];
        primaryContact.linkPrecedence = 'primary';
        await primaryContact.save();
    }

    return primaryContact;
}

// Helper function to create a new primary contact
async function createPrimaryContact(email, phoneNumber) {
    const newContact = new Contact({
        phoneNumber: phoneNumber,
        email: email,
        linkPrecedence: 'primary'
    });

    await newContact.save();
    return newContact;
}

// Helper function to find all linked contacts
async function findLinkedContacts(primaryContactId) {
    return await Contact.find({
        $or: [
            { _id: primaryContactId },
            { linkedId: primaryContactId }
        ]
    });
}

// Helper function to format the response
function formatResponse(primaryContact, contacts) {
    const emails = [];
    const phoneNumbers = [];
    const secondaryContactIds = [];

    // Add primary contact details
    if (primaryContact.email) emails.push(primaryContact.email);
    if (primaryContact.phoneNumber) phoneNumbers.push(primaryContact.phoneNumber);

    // Add secondary contact details
    contacts.forEach(contact => {
        if (contact._id.toString() !== primaryContact._id.toString()) {
            if (contact.email && !emails.includes(contact.email)) emails.push(contact.email);
            if (contact.phoneNumber && !phoneNumbers.includes(contact.phoneNumber)) phoneNumbers.push(contact.phoneNumber);
            secondaryContactIds.push(contact._id);
        }
    });

    return {
        contact: {
            primaryContatctId: primaryContact._id,
            emails: emails,
            phoneNumbers: phoneNumbers,
            secondaryContactIds: secondaryContactIds
        }
    };
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});