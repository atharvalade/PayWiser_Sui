# zkLogin Setup Guide

This guide will help you set up OAuth applications for zkLogin integration.

## 🚀 Quick Start

The zkLogin functionality has been added to your face recognition app, but you need to configure OAuth client IDs for it to work with real providers.

## ⚙️ OAuth Setup Required

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set Application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:8000/face-recognition/` (for local testing)
   - Your production domain + `/face-recognition/`
7. Copy the Client ID and replace `YOUR_GOOGLE_CLIENT_ID` in `script.js`

### 2. Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app → "Consumer" type
3. Add "Facebook Login" product
4. In Settings → Basic, copy the App ID
5. In Facebook Login → Settings:
   - Add redirect URIs: `http://localhost:8000/face-recognition/`
   - Enable "Login with the JavaScript SDK"
6. Replace `YOUR_FACEBOOK_CLIENT_ID` in `script.js`

### 3. Twitch OAuth Setup

1. Go to [Twitch Developers](https://dev.twitch.tv/console)
2. Register a new application
3. Set OAuth Redirect URL: `http://localhost:8000/face-recognition/`
4. Copy the Client ID
5. Replace `YOUR_TWITCH_CLIENT_ID` in `script.js`

## 🔧 Configuration

Edit the `ZKLOGIN_CONFIG` object in `script.js`:

```javascript
const ZKLOGIN_CONFIG = {
    google: {
        clientId: "YOUR_ACTUAL_GOOGLE_CLIENT_ID",
        redirectUri: window.location.origin + "/face-recognition/",
        scope: "openid email profile"
    },
    facebook: {
        clientId: "YOUR_ACTUAL_FACEBOOK_CLIENT_ID", 
        redirectUri: window.location.origin + "/face-recognition/",
        scope: "openid email"
    },
    twitch: {
        clientId: "YOUR_ACTUAL_TWITCH_CLIENT_ID",
        redirectUri: window.location.origin + "/face-recognition/",
        scope: "openid user:read:email"
    }
};
```

## 🎯 Features Implemented

### ✅ **zkLogin Integration**
- **OAuth Providers**: Google, Facebook, Twitch support
- **Privacy-First**: No public linking between OAuth and Sui address
- **Self-Custody**: Users maintain full control
- **Two-Factor Security**: Requires OAuth + salt
- **Easy Onboarding**: No crypto key management needed

### 🔐 **Security Features**
- Ephemeral key pair generation
- JWT nonce with embedded public key
- User salt for address unlinking
- Zero-knowledge proof generation (mock)
- Secure address derivation

### 💳 **Wallet Features**
- Sui address generation and display
- Connection status tracking
- Provider identification
- Address copying to clipboard
- Session persistence
- Disconnect/refresh functionality

## 🎨 **UI Components**

- **Status Indicator**: Shows connection state (🔴/🟢)
- **OAuth Buttons**: Branded login buttons for each provider
- **Wallet Info**: Address, provider, and status display
- **Feature Cards**: Explanation of zkLogin benefits
- **Responsive Design**: Works on mobile and desktop

## 🔄 **zkLogin Flow**

1. **User clicks OAuth login** → Generates ephemeral key pair
2. **Redirects to provider** → User authenticates with OAuth
3. **Returns with JWT** → Contains nonce with embedded public key
4. **Processes authentication** → Generates salt and Sui address
5. **Creates ZK proof** → (Mock implementation for demo)
6. **Updates UI** → Shows connected status and wallet info

## ⚠️ **Demo Limitations**

This is a **demonstration implementation** with simplified components:

- **Mock ZK Proving**: Real zkLogin requires actual ZK proving service
- **Simplified Salt**: Real implementation needs proper salt service
- **Basic Address Generation**: Real zkLogin uses complex cryptographic derivation
- **No Real Transactions**: This demo doesn't interact with Sui network

## 🚀 **Production Requirements**

For a production zkLogin implementation, you would need:

1. **Sui TypeScript SDK** integration
2. **Real ZK Proving Service** (or Mysten Labs service)
3. **Proper Salt Service** with backup/recovery
4. **Cryptographic Libraries** for proper key generation
5. **Sui Network Connection** for actual transactions
6. **Error Handling** for network issues and edge cases

## 🔗 **Useful Links**

- [Sui zkLogin Documentation](https://docs.sui.io/concepts/cryptography/zklogin)
- [zkLogin Integration Guide](https://docs.sui.io/guides/developer/cryptography/zklogin-integration)
- [Sui TypeScript SDK](https://github.com/MystenLabs/sui/tree/main/sdk/typescript)

## 🎯 **Testing the Demo**

1. **Without OAuth setup**: The demo will show placeholder client IDs and won't redirect properly
2. **With OAuth setup**: Full flow will work, generating mock addresses and proofs
3. **UI Testing**: All interface elements work regardless of OAuth setup

The zkLogin section provides a complete UI experience and demonstrates the concepts, even with mock implementations! 🎉
