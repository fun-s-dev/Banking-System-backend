# Backend Ledger

A Node.js banking backend for account management, secure authentication, and ledger-based money transfers built with Express and MongoDB.

## Overview

This project implements a small financial backend that handles user sign-up and login, protected account access, balance lookup, and transfer processing with ledger records. The design centers on a transaction-safe accounting flow, where every debit and credit is recorded immutably and validated against account state and balance.

## Core features

- JWT-based authentication for protected routes
- Password hashing with `bcryptjs`
- Cookie-based token storage and Authorization header fallback
- User authorization checks with `systemUser` enforcement
- Token blacklisting on logout
- Account creation and account-specific balance calculation
- Ledger-driven transaction records for credits and debits
- Idempotency validation for transfer requests
- Transaction state handling for pending, completed, failed, and reversed flows
- Email notifications for registration and transaction events


## Tech Stack

- **Runtime:** Node.js
- **Web Framework:** Express
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication:** JWT, cookie-parser
- **Password Hashing:** bcryptjs
- **Environment Handling:** dotenv
- **Email Transport:** nodemailer

## Architecture and design

The backend is organized around a simple service layer pattern:

- `server.js` starts the application and connects to MongoDB
- `src/app.js` mounts the route modules
- `src/controllers` handle request validation and business logic
- `src/models` define the MongoDB schemas and data relationships
- `src/middleware/auth.middleware.js` enforces authentication and authorization
- `src/services/email.service.js` sends email notifications


### Data Model

- **User:** Stores user identity, credentials, and system user status.
- **Account:** Represents a user account with status and currency.
- **Transaction:** Captures transfer metadata and transaction status.
- **Ledger:** Records debit and credit entries for accounts and transactions.
- **TokenBlacklist:** Stores revoked JWTs to prevent reuse after logout.

### Banking ledger design

The ledger records are central to the accounting model:

- each transfer creates a transaction record
- each transfer creates a debit ledger entry for the sender account
- each transfer creates a credit ledger entry for the receiver account
- ledger entries are protected from modification or deletion
- account balance is derived by aggregating ledger totals for a given account

The account balance logic is implemented in `accountSchema.methods.getBalance()` and computes the difference between total credit and debit values for the account.

## Security and authentication

Authentication is implemented in the middleware and controllers:

- user passwords are hashed before save
- JWTs are issued on registration and login
- tokens are attached to a cookie named `token`
- the middleware reads the token from the cookie or the `Authorization` header
- token blacklist checks reject logged-out tokens
- system-user routes require the authenticated user to have `systemUser` enabled

Unauthorized or invalid tokens return HTTP 401 responses, and non-system users are rejected with HTTP 403 on restricted routes.

## Transaction safety and idempotency

The transfer flow validates several conditions before completing a transaction:

- required fields must be present
- sender and receiver accounts must exist
- both accounts must be `active`
- the sender balance must cover the transfer amount
- duplicate requests are checked with `idempotencyKey`

The transaction controller uses a MongoDB session and commit model to coordinate ledger writes and status changes. Transaction status values include `pending`, `completed`, `failed`, and `reversed`.

## API overview

All routes are mounted under `/api`.

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/auth/register` | POST | Create a new user |
| `/api/auth/login` | POST | Authenticate a user and return a JWT |
| `/api/auth/logout` | POST | Clear the cookie and blacklist the active token |
| `/api/accounts` | POST | Create an account for the authenticated user |
| `/api/accounts` | GET | Fetch all accounts for the authenticated user |
| `/api/accounts/balance/:accountId` | GET | Get the balance for a specific user-owned account |
| `/api/transactions` | POST | Transfer funds between two active accounts |
| `/api/transactions/system/initial-funds` | POST | Create an initial funds transfer using a system user account |

### Request example

```json
{
  "fromAccount": "account_id",
  "toAccount": "account_id",
  "amount": 100,
  "idempotencyKey": "unique-transfer-key"
}
```

## Email notifications

The project sends email notifications through Gmail OAuth2 configuration in `src/services/email.service.js`.

Current notification flows include:

- registration welcome email
- successful transaction email
- failed transaction email

## Environment variables

Create a `.env` file in the project root with the following keys:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email_address
CLIENT_ID=your_google_oauth_client_id
CLIENT_SECRET=your_google_oauth_client_secret
REFRESH_TOKEN=your_google_oauth_refresh_token
```


## Setup and running

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file using the variables above.

3. Start the application in development mode:

```bash
npm run dev
```

4. Or start the server directly:

```bash
npm start
```

The server listens on port `3000`.

## Notes

- This repository contains the backend only. There is no frontend application.
- MongoDB connection is established during startup through `src/config/db.js`.
- The project does not define a test suite in the current `package.json` scripts.
