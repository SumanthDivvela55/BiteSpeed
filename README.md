# Bitespeed Backend Task: Identity Reconciliation 

Bitespeed needs a way to identify and keep track of a customer's identity across multiple purchases.

We know that orders on FluxKart.com will always have either an **`email`** or **`phoneNumber`** in the checkout event.

Bitespeed keeps track of the collected contact information in a relational database table named **`Contact`.**

# Setup Instructions

## Prerequisites
- Node.js (Latest LTS version recommended)
- MongoDB (Locally installed or a MongoDB Atlas account)
- A `.env` file with the `MONGO_URL` variable set

## Installation Steps

### git clone <repository_url>
Clones the repository.

### cd <repository_folder>
Navigate into the project directory.

### npm install
Installs all dependencies.

### touch .env
Creates a `.env` file in the root directory.

Add the following line in `.env` file:
```sh
MONGO_URL=<your_mongodb_connection_string>
PORT=<port_number>
```
node server.js

