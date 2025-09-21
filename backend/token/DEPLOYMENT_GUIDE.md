# PayWiser Token Deployment Guide

Complete step-by-step guide to deploy your PayWiser Token as an NTT on Wormhole.

## 🎯 What You're Creating

**PayWiser Token (PWSR)**
- ✅ Native Sui token with 8 decimals
- ✅ Cross-chain transfers via Wormhole NTT
- ✅ 10M max supply
- ✅ Burn and mint capabilities for bridging
- ✅ Integration ready for your face recognition app

## 📋 Prerequisites

### 1. Install Sui CLI
```bash
# For macOS (Intel)
curl -fLJO https://github.com/MystenLabs/sui/releases/download/testnet-v1.14.2/sui-testnet-v1.14.2-macos-x86_64.tgz
tar -xzf sui-testnet-v1.14.2-macos-x86_64.tgz
sudo mv sui-testnet-v1.14.2-macos-x86_64/sui /usr/local/bin/

# For macOS (Apple Silicon)
curl -fLJO https://github.com/MystenLabs/sui/releases/download/testnet-v1.14.2/sui-testnet-v1.14.2-macos-arm64.tgz
tar -xzf sui-testnet-v1.14.2-macos-arm64.tgz
sudo mv sui-testnet-v1.14.2-macos-arm64/sui /usr/local/bin/

# Verify installation
sui --version
```

### 2. Set up Sui Wallet
```bash
# Create new wallet
sui client new-address ed25519

# Switch to testnet
sui client switch --env testnet

# Get testnet SUI tokens
sui client faucet

# Check balance (should show SUI tokens)
sui client balance
```

### 3. Install Node.js Dependencies
```bash
cd backend/token
npm install
```

## 🚀 Deployment Steps

### Step 1: Build and Deploy Token Contract

```bash
# Navigate to token directory
cd backend/token

# Deploy the token contract
npm run deploy
```

**Expected Output:**
```
🚀 Deploying PayWiser Token...
📦 Building Move package...
✅ Build successful!
🌐 Publishing to Sui testnet...
✅ Deployment successful!

📋 Deployment Information:
Package ID: 0x1234567890abcdef...
Treasury Cap ID: 0xabcdef1234567890...
Token Info ID: 0x9876543210fedcba...
Mint Cap ID: 0xfedcba0987654321...
```

### Step 2: Mint Initial Token Supply

```bash
# Mint 1 million PWSR tokens
npm run mint
```

**Expected Output:**
```
🪙 Minting PayWiser Tokens...
💰 Minting 1,000,000.00000000 PWSR tokens...
✅ Minting successful!

🪙 Minted Coin Details:
Coin Object ID: 0x1111222233334444...
Amount: 1,000,000.00000000 PWSR
Owner: 0xYourSuiAddress...
```

### Step 3: Set up Wormhole NTT

```bash
# Configure NTT for cross-chain transfers
npm run setup-ntt
```

**Expected Output:**
```
🌉 Setting up PayWiser Token NTT on Wormhole...
📝 Step 1: Registering token with Wormhole...
✅ Token registered with Wormhole
🔗 Step 2: Setting up cross-chain configurations...
✅ Cross-chain configurations set up
🎉 PayWiser Token NTT setup complete!
```

### Step 4: Verify Deployment

```bash
# Check your token balance
sui client balance

# View token information
sui client object <COIN_OBJECT_ID>
```

## 📁 Generated Files

After successful deployment, you'll have:

```
token/config/
├── deployment.json           # Contract addresses and deployment info
├── token-config.json        # Token metadata and configuration
├── ntt-config.json         # Wormhole NTT configuration
└── integration-snippets.json # Code examples for integration
```

## 🎯 Token Details

**Deployed Contract:**
- **Name**: PayWiser Token
- **Symbol**: PWSR
- **Decimals**: 8
- **Max Supply**: 10,000,000 PWSR
- **Initial Mint**: 1,000,000 PWSR

**NTT Features:**
- ✅ Cross-chain transfers via Wormhole
- ✅ Support for 8+ blockchains (Ethereum, Polygon, BSC, etc.)
- ✅ Rate limiting for security
- ✅ Burn and mint mechanism

## 🔗 Cross-Chain Support

Your PWSR token can be transferred to:
- **Ethereum** (Sepolia testnet)
- **Polygon** (Mumbai testnet)  
- **BSC** (testnet)
- **Avalanche** (Fuji testnet)
- **Arbitrum** (testnet)
- **Optimism** (testnet)
- **Fantom** (testnet)

## 📱 Integration Examples

### JavaScript/TypeScript
```javascript
import { Wormhole } from '@wormhole-foundation/sdk';

// Transfer PWSR from Sui to Ethereum
const transfer = await wormhole.ntt.transfer({
    token: 'YOUR_PACKAGE_ID',
    amount: '100000000', // 1 PWSR (8 decimals)
    fromChain: 'sui',
    toChain: 'ethereum',
    recipient: '0xYourEthereumAddress'
});
```

### Sui CLI
```bash
# Mint tokens for cross-chain transfer
sui client call \
  --package YOUR_PACKAGE_ID \
  --module paywiser_token \
  --function mint \
  --args TREASURY_CAP_ID TOKEN_INFO_ID 100000000 YOUR_ADDRESS \
  --gas-budget 10000000
```

## 🔍 Monitoring

### Check Token Supply
```bash
sui client object TOKEN_INFO_ID
```

### Monitor Cross-Chain Transfers
- **Wormhole Scanner**: https://wormholescan.io/
- **Token Tracker**: Check your token on supported explorers

## ❓ Troubleshooting

### Common Issues:

**1. "Insufficient gas" error**
```bash
# Get more testnet SUI
sui client faucet
```

**2. "Object not found" error**
```bash
# Make sure you're on testnet
sui client switch --env testnet
```

**3. "Package not published" error**
```bash
# Rebuild and redeploy
npm run build
npm run deploy
```

## 🎉 Success!

You now have:
- ✅ **PayWiser Token** deployed on Sui testnet
- ✅ **1M PWSR tokens** in your wallet
- ✅ **Cross-chain capabilities** via Wormhole NTT
- ✅ **Integration ready** for your PayWiser ecosystem

## 🚀 Next Steps

1. **Test cross-chain transfers** on testnet
2. **Integrate PWSR** into your face recognition app
3. **Set up monitoring** and alerts
4. **Deploy to mainnet** when ready

Your PayWiser Token is now live and ready for cross-chain action! 🌉✨
