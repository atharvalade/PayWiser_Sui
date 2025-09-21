#!/usr/bin/env node

const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { fromB64 } = require('@mysten/sui/utils');

// Test the private key
const privateKeyB64 = '3GInch4KuXu922aU4qCs9PmXgE59c/4S73OtzDStYVM=';
const expectedAddress = '0xcb3fced2337776c984f220f27e97428f426f80e5b771a3e467b2d6f14597929c';

console.log('Testing private key decoding...');
console.log('Private key (base64):', privateKeyB64);
console.log('Expected address:', expectedAddress);

try {
    // Try to decode the private key
    const privateKeyBytes = fromB64(privateKeyB64);
    console.log('Private key bytes length:', privateKeyBytes.length);
    console.log('Private key bytes:', Array.from(privateKeyBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
    
    // Try to create keypair
    const keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
    const derivedAddress = keypair.getPublicKey().toSuiAddress();
    
    console.log('Derived address:', derivedAddress);
    console.log('Match:', derivedAddress === expectedAddress);
    
} catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
}
