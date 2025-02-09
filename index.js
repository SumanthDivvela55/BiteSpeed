const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Contact = require('./models/Contact');

const app = express();
app.use(bodyParser.json());
require('dotenv').config()


mongoose.connect(`${process.env.MONGO_URL}/bitespeed2`, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))


app.post('/identify', async (req, res) => {
    const { email, phoneNumber } = req.body;
    try {
        let primaryContact = await findPrimaryContact(email, phoneNumber);
        if (!primaryContact) {
            primaryContact = await createPrimaryContact(email, phoneNumber);
        }
        const contacts = await findLinkedContacts(primaryContact._id);
        const response = formatResponse(primaryContact, contacts);
        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

async function findPrimaryContact(email, phoneNumber) {
    const matchingContacts = await Contact.find({
        $or: [
            { email: email },
            { phoneNumber: phoneNumber }
        ]
    }).sort({ createdAt: 1 });

    if (matchingContacts.length === 0) {
        return null; 
    }

    let primaryContact = matchingContacts.find(contact => contact.linkPrecedence === 'primary');

    if (!primaryContact) {
        primaryContact = matchingContacts[0];
        primaryContact.linkPrecedence = 'primary';
        await primaryContact.save();
    }

    return primaryContact;
}

async function createPrimaryContact(email, phoneNumber) {
    const newContact = new Contact({
        phoneNumber: phoneNumber,
        email: email,
        linkPrecedence: 'primary'
    });

    await newContact.save();
    return newContact;
}
async function findLinkedContacts(primaryContactId) {
    return await Contact.find({
        $or: [
            { _id: primaryContactId },
            { linkedId: primaryContactId }
        ]
    });
}

function formatResponse(primaryContact, contacts) {
    const emails = [];
    const phoneNumbers = [];
    const secondaryContactIds = [];

    if (primaryContact.email) emails.push(primaryContact.email);
    if (primaryContact.phoneNumber) phoneNumbers.push(primaryContact.phoneNumber);

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