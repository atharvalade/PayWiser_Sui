# PayWiser - Sui Backend

A Node.js backend service for handling Sui blockchain operations including wallet creation, USDC transfers, and gas-sponsored transactions.

## Features

- ✅ Create new Sui wallets
- ✅ Transfer USDC between accounts
- ✅ Gas-sponsored transactions
- ✅ Balance checking
- ✅ Transaction details lookup
- ✅ Testnet faucet integration

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Wallets (Optional)

```bash
# Create new wallets with proper private keys
node scripts/create-wallet.js

# Check existing wallet balances  
node scripts/check-balances.js

# Run complete transfer demo
node scripts/demo-transfer.js
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Sui Network Configuration
SUI_NETWORK=testnet
SUI_RPC_URL=https://fullnode.testnet.sui.io:443

# Gas Sponsor Account (Private Key in base64)
GAS_SPONSOR_PRIVATE_KEY=your_sponsor_private_key_here

# USDC Token Configuration (Testnet)
USDC_COIN_TYPE=0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check
- **GET** `/health` - Check server status

### Wallet Operations

#### Create New Wallet
- **POST** `/api/wallet/create`
- **Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "privateKey": "base64_private_key",
    "publicKey": "base64_public_key"
  },
  "message": "Wallet created successfully"
}
```

#### Get Wallet Balance
- **POST** `/api/wallet/balance`
- **Body:**
```json
{
  "address": "0x..."
}
```

#### Request Test Tokens (Testnet Only)
- **POST** `/api/wallet/faucet`
- **Body:**
```json
{
  "address": "0x..."
}
```

### Transfer Operations

#### Transfer USDC
- **POST** `/api/transfer/usdc`
- **Body:**
```json
{
  "fromPrivateKey": "base64_private_key",
  "toAddress": "0x...",
  "amount": 10.5
}
```

#### Get Transaction Details
- **POST** `/api/transfer/transaction`
- **Body:**
```json
{
  "digest": "transaction_digest"
}
```

### Sponsored Transactions

#### Gas-Sponsored USDC Transfer
- **POST** `/api/sponsor/transfer-usdc`
- **Body:**
```json
{
  "fromPrivateKey": "base64_private_key",
  "toAddress": "0x...",
  "amount": 10.5
}
```

#### Get Sponsor Information
- **GET** `/api/sponsor/info`

## Usage Examples

### 1. Create a New Wallet

```bash
curl -X POST http://localhost:3000/api/wallet/create
```

### 2. Check Balance

```bash
curl -X POST http://localhost:3000/api/wallet/balance \
  -H "Content-Type: application/json" \
  -d '{"address": "0x..."}'
```

### 3. Transfer USDC

```bash
curl -X POST http://localhost:3000/api/transfer/usdc \
  -H "Content-Type: application/json" \
  -d '{
    "fromPrivateKey": "your_base64_private_key",
    "toAddress": "0x...",
    "amount": 10.0
  }'
```

### 4. Sponsored Transfer

```bash
curl -X POST http://localhost:3000/api/sponsor/transfer-usdc \
  -H "Content-Type: application/json" \
  -d '{
    "fromPrivateKey": "your_base64_private_key",
    "toAddress": "0x...",
    "amount": 10.0
  }'
```

## Setting Up Gas Sponsorship

1. Create a sponsor wallet with sufficient SUI for gas fees
2. Export the private key in base64 format
3. Add it to your `.env` file as `GAS_SPONSOR_PRIVATE_KEY`

To get the private key in base64 format from a Sui CLI wallet:

```bash
# Export from Sui CLI (if you have a wallet there)
sui keytool export --key-identity [address] --json
```

## USDC on Sui Testnet

The default USDC coin type for Sui testnet is:
```
0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN
```

You can get testnet USDC from:
- Sui testnet faucets
- DEX platforms on testnet
- Bridge from other testnets

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Security Notes

- Never expose private keys in logs or responses
- Use environment variables for sensitive configuration
- Consider rate limiting for production use
- Validate all inputs thoroughly
- Use HTTPS in production

## Development

### Project Structure

```
src/
├── server.js          # Express server setup
├── services/
│   └── suiService.js  # Sui blockchain service
└── routes/
    ├── wallet.js      # Wallet operations
    ├── transfer.js    # Transfer operations
    └── sponsor.js     # Sponsored transactions

scripts/
├── create-wallet.js   # Create new wallets with proper private keys
├── check-balances.js  # Check balances of multiple wallets
├── demo-transfer.js   # Complete transfer demo with sponsorship
└── setup.js          # Initial project setup

WALLETS.txt           # Your working wallet information
test-api.http         # API testing endpoints
```

### Adding New Features

1. Add business logic to `suiService.js`
2. Create route handlers in appropriate route files
3. Add validation schemas using Joi
4. Update this README

## Troubleshooting

### Common Issues

1. **"Gas sponsor account not configured"**
   - Set `GAS_SPONSOR_PRIVATE_KEY` in your `.env` file

2. **"No USDC coins found in sender account"**
   - The sender needs USDC tokens first
   - Use the faucet or transfer USDC to the account

3. **"Transfer failed"**
   - Check if sender has sufficient balance
   - Verify addresses are correct
   - Ensure network connectivity

### Logs

The server logs all operations. Check console output for detailed error information.

## License

MIT
