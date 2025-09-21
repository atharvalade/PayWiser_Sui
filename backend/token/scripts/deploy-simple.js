#!/usr/bin/env node

/**
 * Simplified PayWiser Token Deployment using Sui SDK
 */

const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { Transaction } = require('@mysten/sui/transactions');
const { fromB64 } = require('@mysten/sui/utils');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Wallet A (Gas Sponsor) details
const WALLET_A = {
    privateKey: '3GInch4KuXu922aU4qCs9PmXgE59c/4S73OtzDStYVM=',
    address: '0xcb3fced2337776c984f220f27e97428f426f80e5b771a3e467b2d6f14597929c'
};

async function deployToken() {
    console.log('🚀 Deploying PayWiser Token using Sui SDK...\n');

    try {
        // Initialize client and keypair
        const client = new SuiClient({ url: getFullnodeUrl('testnet') });
        const keypair = Ed25519Keypair.fromSecretKey(fromB64(WALLET_A.privateKey));
        
        // Verify address matches
        const derivedAddress = keypair.getPublicKey().toSuiAddress();
        if (derivedAddress !== WALLET_A.address) {
            throw new Error(`Address mismatch: expected ${WALLET_A.address}, got ${derivedAddress}`);
        }
        
        console.log('✅ Wallet verified:', WALLET_A.address);
        
        // Check balance
        const balance = await client.getBalance({
            owner: WALLET_A.address,
            coinType: '0x2::sui::SUI'
        });
        
        console.log(`💰 Current balance: ${(parseInt(balance.totalBalance) / 1e9).toFixed(9)} SUI\n`);
        
        if (parseInt(balance.totalBalance) < 100000000) { // 0.1 SUI
            throw new Error('Insufficient balance for deployment. Need at least 0.1 SUI.');
        }

        // Build the Move package
        console.log('📦 Building Move package...');
        execSync('sui move build', { 
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
        console.log('✅ Build successful!\n');

        // Set up Sui client configuration with the private key
        const suiConfigDir = path.join(require('os').homedir(), '.sui', 'sui_config');
        const tempKeyFile = path.join(__dirname, '..', 'temp_keystore.key');
        
        // Write the private key to a temporary file
        fs.writeFileSync(tempKeyFile, WALLET_A.privateKey);
        
        console.log('📦 Publishing package to Sui testnet...');
        
        // Use Sui CLI to publish with specific gas budget
        const publishCommand = `sui client publish --gas-budget 100000000 --json --keystore-path ${tempKeyFile}`;
        const publishOutput = execSync(publishCommand, {
            encoding: 'utf8',
            cwd: path.join(__dirname, '..')
        });

        // Clean up temporary key file
        fs.unlinkSync(tempKeyFile);
        
        const result = JSON.parse(publishOutput);

        if (result.status === 'success') {
            console.log('✅ Deployment successful!\n');
            console.log('📋 Transaction Details:');
            console.log(`Transaction Digest: ${result.digest}`);
            console.log(`Status: ${result.status}`);

            // Extract deployment information
            const packageId = result.objectChanges?.find(
                change => change.type === 'published'
            )?.packageId;

            const createdObjects = result.objectChanges?.filter(
                change => change.type === 'created'
            ) || [];

            const treasuryCapId = createdObjects.find(
                obj => obj.objectType?.includes('TreasuryCap')
            )?.objectId;

            const tokenInfoId = createdObjects.find(
                obj => obj.objectType?.includes('TokenInfo')
            )?.objectId;

            const mintCapId = createdObjects.find(
                obj => obj.objectType?.includes('MintCap')
            )?.objectId;

            console.log('\n🎯 Deployment Information:');
            console.log(`Package ID: ${packageId}`);
            console.log(`Treasury Cap ID: ${treasuryCapId}`);
            console.log(`Token Info ID: ${tokenInfoId}`);
            console.log(`Mint Cap ID: ${mintCapId}`);

            // Save deployment info
            const deploymentInfo = {
                packageId,
                treasuryCapId,
                tokenInfoId,
                mintCapId,
                deployedAt: new Date().toISOString(),
                network: 'testnet',
                transactionDigest: result.digest,
                deployerAddress: WALLET_A.address
            };

            const configPath = path.join(__dirname, '..', 'config', 'deployment.json');
            fs.writeFileSync(configPath, JSON.stringify(deploymentInfo, null, 2));
            console.log(`\n💾 Deployment info saved to: ${configPath}`);

            console.log('\n🎉 PayWiser Token (PWSR) deployed successfully!');
            console.log('\n🔗 View on Sui Explorer:');
            console.log(`https://suiexplorer.com/txblock/${result.digest}?network=testnet`);

            return deploymentInfo;
            
        } else {
            console.error('❌ Deployment failed:', result);
            throw new Error(`Deployment failed with status: ${result.status}`);
        }

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        process.exit(1);
    }
}

// Run deployment
deployToken();
