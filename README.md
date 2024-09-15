# Svault

This project demonstrates how to manage a vault to store Native SOLs using blinks. It is built using [Next.js](https://nextjs.org) and leverages the `@solana/actions`, `@solana/web3.js`, and `@coral-xyz/anchor` libraries to interact with the Solana blockchain.

## What is it?

The main use of Svault is to provide a simple and efficient way to manage a vault on the Solana blockchain. This can be useful for developers building decentralized applications (dApps) on the Solana blockchain, as well as for users who need to create, deposit, withdraw, and close their vaults.

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Endpoints

### Create Vault

- **Endpoint:** `/api/actions/initialize`
- **Method:** `POST`

### Deposit SOL

- **Endpoint:** `/api/actions/deposit`
- **Method:** `POST`
- **Body Parameters:**
    - `amount`: The amount of SOL to deposit.

### Withdraw SOL

- **Endpoint:** `/api/actions/withdraw`
- **Method:** `POST`
- **Body Parameters:**
    - `amount`: The amount of SOL to withdraw.

### Close Vault

- **Endpoint:** `/api/actions/close`
- **Method:** `POST`
