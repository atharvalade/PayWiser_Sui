# Seal Protocol Integration

This directory contains the integration code for **Seal Protocol** - a privacy-preserving encryption system for biometric data storage and access control.

## Overview

Seal Protocol provides:
- **Encrypted Biometric Storage**: Face/voice embeddings are encrypted before off-chain storage
- **On-Chain Access Policies**: Smart contracts control who can decrypt data and under what conditions
- **Fresh Nonce Requirements**: Prevents replay attacks with time-limited, single-use nonces
- **Verifier-Only Decryption**: Only authorized verifier services can decrypt data

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Biometric     │    │   Seal Protocol  │    │   Off-Chain     │
│   Capture       │───▶│   Encryption     │───▶│   Storage       │
│   (Face/Voice)  │    │                  │    │   (IPFS/Arweave)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   On-Chain       │
                       │   Access Policy  │
                       │   (Sui Contract) │
                       └──────────────────┘
```

## Files Structure

```
backend/
├── src/
│   ├── services/
│   │   └── sealService.js          # Main Seal Protocol service
│   ├── config/
│   │   └── sealConfig.js           # Configuration settings
│   ├── routes/
│   │   └── seal.js                 # API endpoints
│   └── utils/
│       └── sealUtils.js            # Utility functions
└── seal/
    ├── README.md                   # This file
    ├── examples/                   # Usage examples
    └── contracts/                  # Smart contract interfaces
```

## Key Features

### 1. Encrypted Biometric Storage
- **AES-256-GCM encryption** for face/voice embeddings
- **Key derivation** using PBKDF2 with high iteration count
- **Authenticated encryption** with integrity protection
- **Secure key management** with verifier-only access

### 2. On-Chain Access Policies
- **Smart contract policies** on Sui blockchain
- **Conditional access** based on user/terminal IDs
- **Time-limited permissions** with automatic expiration
- **Verifier authorization** with signature requirements

### 3. Fresh Nonce System
- **Cryptographically secure** nonce generation
- **Time-limited validity** (5 minutes default)
- **Single-use enforcement** prevents replay attacks
- **Context-aware** nonces tied to user/terminal

### 4. Privacy Protection
- **Zero-knowledge** biometric verification
- **No plaintext storage** of sensitive data
- **Selective disclosure** with policy enforcement
- **Audit trail** for all access attempts

## API Endpoints

### Encrypt Biometric Data
```http
POST /api/seal/encrypt
Content-Type: application/json

{
  "biometricData": {
    "type": "face",
    "data": {
      "embeddings": [0.1, 0.2, ...],
      "metadata": { "quality": 0.95 }
    },
    "timestamp": 1234567890,
    "quality": 0.95
  },
  "userId": "user123",
  "terminalId": "terminal456",
  "dataType": "face_embeddings"
}
```

### Generate Fresh Nonce
```http
POST /api/seal/generate-nonce
Content-Type: application/json

{
  "userId": "user123",
  "terminalId": "terminal456"
}
```

### Decrypt with Policy Validation
```http
POST /api/seal/decrypt
Content-Type: application/json

{
  "storageReference": "seal://ipfs/QmHash...",
  "userId": "user123",
  "terminalId": "terminal456",
  "requestNonce": "1234567890-abc12345-def67890"
}
```

## Configuration

### Environment Variables
```bash
# Seal Protocol Configuration
SEAL_PACKAGE_ID=0x...                    # Sui package ID for Seal contracts
SEAL_VERIFIER_PRIVATE_KEY=base64...      # Verifier service private key
SEAL_STORAGE_PROVIDER=ipfs               # Storage provider (ipfs/arweave)

# IPFS Configuration (if using IPFS storage)
IPFS_GATEWAY=https://ipfs.io/ipfs/
IPFS_API_KEY=your_pinata_api_key
IPFS_SECRET_KEY=your_pinata_secret

# Security Settings
DEBUG_SEAL=true                          # Enable debug logging
SKIP_POLICY_VALIDATION=false             # Skip policy validation (dev only)
```

### Policy Configuration
```javascript
// Default access conditions
{
  requiresFreshNonce: true,
  maxAge: 3600000,                       // 1 hour
  maxDecryptionAttempts: 3,
  requireVerifierSignature: true
}
```

## Usage Examples

### 1. Basic Biometric Encryption
```javascript
const sealService = new SealService();

// Encrypt face embeddings
const encryptedPackage = await sealService.encryptBiometricData(
  faceEmbeddings,
  'user123',
  'terminal456'
);

// Store encrypted data
const storageRef = await sealService.storeEncryptedData(encryptedPackage);
```

### 2. Secure Decryption
```javascript
// Generate fresh nonce
const nonce = crypto.randomBytes(32).toString('hex');

// Decrypt with policy validation
const biometricData = await sealService.decryptBiometricData(
  encryptedData,
  policy,
  nonce,
  'user123',
  'terminal456'
);
```

### 3. Policy Management
```javascript
// Create access policy
const policy = await sealService.createOnChainPolicy({
  requiresFreshNonce: true,
  maxAge: 7200000,  // 2 hours
  allowedVerifiers: ['0xverifier...']
});
```

## Security Considerations

### 1. Key Management
- **Verifier private keys** must be stored securely (HSM recommended)
- **Key rotation** should be performed regularly (30 days default)
- **Backup encryption** for all sensitive keys

### 2. Nonce Security
- **Never reuse nonces** - single use only
- **Short expiration times** (5 minutes max)
- **Secure generation** using crypto.randomBytes()

### 3. Policy Enforcement
- **Always validate policies** before decryption
- **Check expiration times** on all access attempts
- **Log policy violations** for security monitoring

### 4. Storage Security
- **Encrypted at rest** in off-chain storage
- **Integrity verification** using checksums
- **Redundant storage** for data availability

## Integration with PayWiser

In the PayWiser system, Seal Protocol is used to:

1. **Encrypt face embeddings** captured during customer recognition
2. **Store encrypted data** off-chain with IPFS/Arweave
3. **Create access policies** tied to specific terminals/merchants
4. **Validate access** using fresh nonces for each verification attempt
5. **Audit access** for compliance and security monitoring

### Face Recognition Flow with Seal
```
1. Customer face captured at terminal
2. Face embeddings extracted
3. Embeddings encrypted with Seal Protocol
4. Encrypted data stored off-chain
5. Access policy created on-chain
6. For verification: Generate fresh nonce
7. Decrypt embeddings with policy validation
8. Perform biometric matching
9. Log access attempt
```

## Development and Testing

### Mock Mode
For development, set `NODE_ENV=development` to enable:
- **Mock encryption** (faster processing)
- **Skip policy validation** (optional)
- **Debug logging** for troubleshooting
- **In-memory storage** instead of IPFS/Arweave

### Testing
```bash
# Run Seal service tests
npm test -- --grep "Seal"

# Test encryption/decryption
node examples/seal-encryption-test.js

# Test policy validation
node examples/seal-policy-test.js
```

## Compliance and Auditing

Seal Protocol provides:
- **GDPR compliance** through encrypted storage and right to erasure
- **HIPAA compatibility** with proper key management
- **SOC 2 Type II** audit trail capabilities
- **ISO 27001** security controls implementation

## Support and Documentation

- **Seal Protocol Docs**: https://seal-protocol.org/docs
- **Sui Integration Guide**: https://docs.sui.io
- **IPFS Storage Guide**: https://docs.ipfs.io
- **Security Best Practices**: See `SECURITY.md`

---

**Note**: This is a demonstration implementation. For production use, ensure proper security audits, key management, and compliance reviews are completed.
