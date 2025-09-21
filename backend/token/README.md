# PayWiser Token - NTT on Wormhole

This guide will help you create and deploy your own NTT (Native Token Transfer) token called "PayWiser Token" on Sui using Wormhole.

## 🎯 Overview

**Token Details:**
- **Name**: PayWiser Token
- **Symbol**: PWSR
- **Type**: NTT (Native Token Transfer)
- **Network**: Sui
- **Cross-chain**: Wormhole enabled

## 🛠️ Prerequisites

### 1. Install Sui CLI
```bash
# Install Sui CLI
curl -fLJO https://github.com/MystenLabs/sui/releases/download/testnet-v1.14.2/sui-testnet-v1.14.2-macos-x86_64.tgz
tar -xzf sui-testnet-v1.14.2-macos-x86_64.tgz
sudo mv sui-testnet-v1.14.2-macos-x86_64/sui /usr/local/bin/
```

### 2. Install Wormhole CLI
```bash
# Install Wormhole CLI
npm install -g @wormhole-foundation/wormhole-cli
```

### 3. Set up Sui Wallet
```bash
# Create new Sui address
sui client new-address ed25519

# Get testnet SUI tokens
sui client faucet

# Check balance
sui client balance
```

## 📁 Project Structure

```
token/
├── README.md                 # This file
├── contracts/
│   └── paywiser_token.move  # Token contract
├── scripts/
│   ├── deploy.js            # Deployment script
│   ├── mint.js              # Minting script
│   └── setup-ntt.js         # NTT setup script
├── config/
│   └── token-config.json    # Token configuration
└── Move.toml                # Sui Move project config
```

## 🚀 Quick Start

### Step 1: Deploy Token Contract
```bash
cd token
sui move build
sui move publish --gas-budget 100000000
```

### Step 2: Set up NTT
```bash
# Configure NTT for cross-chain transfers
node scripts/setup-ntt.js
```

### Step 3: Mint Initial Supply
```bash
# Mint initial PayWiser Tokens
node scripts/mint.js
```

## 🎯 Token Features

- **Cross-chain transfers** via Wormhole
- **Burn and mint** mechanism for bridging
- **Customizable supply** and minting controls
- **Integration ready** for your PayWiser ecosystem

## 📋 Next Steps

1. Deploy the token contract
2. Set up NTT configuration
3. Mint initial token supply
4. Integrate with your face recognition app
5. Enable cross-chain functionality

Let's get started! 🚀
