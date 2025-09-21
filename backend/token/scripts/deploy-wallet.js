#!/usr/bin/env node

/**
 * PayWiser Token Deployment Script with Wallet A
 * Uses Sui CLI for deployment with specified wallet
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { fromB64 } = require('@mysten/sui/utils');

// Wallet A (Gas Sponsor) details
const WALLET_A = {
    privateKey: '3GInch4KuXu922aU4qCs9PmXgE59c/4S73OtzDStYVM=',
    address: '0xcb3fced2337776c984f220f27e97428f426f80e5b771a3e467b2d6f14597929c'
};

console.log('🚀 Deploying PayWiser Token with Wallet A...\n');

async function deployToken() {
    try {
        // Initialize client and verify wallet
        const client = new SuiClient({ url: getFullnodeUrl('testnet') });
        const keypair = Ed25519Keypair.fromSecretKey(fromB64(WALLET_A.privateKey));
        
        // Verify address matches
        const derivedAddress = keypair.getPublicKey().toSuiAddress();
        console.log(`🔑 Derived address: ${derivedAddress}`);
        console.log(`🎯 Target address: ${WALLET_A.address}`);
        
        if (derivedAddress !== WALLET_A.address) {
            throw new Error(`Address mismatch: expected ${WALLET_A.address}, got ${derivedAddress}`);
        }
        
        console.log('✅ Wallet verified successfully\n');
        
        // Check balance
        const balance = await client.getBalance({
            owner: WALLET_A.address,
            coinType: '0x2::sui::SUI'
        });
        
        const balanceInSui = (parseInt(balance.totalBalance) / 1e9).toFixed(9);
        console.log(`💰 Current balance: ${balanceInSui} SUI`);
        
        if (parseInt(balance.totalBalance) < 100000000) { // 0.1 SUI
            throw new Error('Insufficient balance for deployment. Need at least 0.1 SUI.');
        }
        console.log('✅ Sufficient balance for deployment\n');

        // Step 1: Build the Move package
        console.log('📦 Building Move package...');
        try {
            execSync('./sui move build', { 
                stdio: 'inherit',
                cwd: path.join(__dirname, '..')
            });
            console.log('✅ Build successful!\n');
        } catch (buildError) {
            console.error('❌ Build failed:', buildError.message);
            throw buildError;
        }

        // Step 2: Create a temporary keystore file in the correct format
        const tempDir = path.join(__dirname, '..', 'temp_sui_config');
        const keystorePath = path.join(tempDir, 'sui.keystore');
        
        // Create temp directory
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Create keystore file with the private key in the correct format
        // Sui keystore expects the key with the 0x00 prefix for Ed25519
        const keystoreData = [`0x00${WALLET_A.privateKey}`];
        fs.writeFileSync(keystorePath, JSON.stringify(keystoreData, null, 2));

        console.log('📦 Publishing to Sui testnet...');
        
        // Step 3: Publish using Sui CLI with keystore path and switch to testnet
        const publishCommand = `./sui client switch --env testnet && ./sui client publish --gas-budget 100000000 --json --keystore-path ${keystorePath}`;
        
        let publishOutput;
        try {
            publishOutput = execSync(publishCommand, {
                encoding: 'utf8',
                cwd: path.join(__dirname, '..')
            });
        } catch (publishError) {
            console.error('❌ Publish command failed:', publishError.message);
            if (publishError.stdout) {
                console.error('stdout:', publishError.stdout.toString());
            }
            if (publishError.stderr) {
                console.error('stderr:', publishError.stderr.toString());
            }
            throw publishError;
        }

        // Clean up temporary files
        fs.rmSync(tempDir, { recursive: true, force: true });

        console.log('✅ Deployment successful!\n');

        // Parse the result
        const result = JSON.parse(publishOutput);
        
        if (result.status === 'success') {
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

            const upgradeCapId = createdObjects.find(
                obj => obj.objectType?.includes('UpgradeCap')
            )?.objectId;

            console.log('\n🎯 Deployment Information:');
            console.log(`📦 Package ID: ${packageId}`);
            console.log(`💰 Treasury Cap ID: ${treasuryCapId}`);
            console.log(`ℹ️  Token Info ID: ${tokenInfoId}`);
            console.log(`🔨 Mint Cap ID: ${mintCapId}`);
            console.log(`⬆️  Upgrade Cap ID: ${upgradeCapId}`);

            // Save deployment info
            const deploymentInfo = {
                packageId,
                treasuryCapId,
                tokenInfoId,
                mintCapId,
                upgradeCapId,
                deployedAt: new Date().toISOString(),
                network: 'testnet',
                transactionDigest: result.digest,
                deployerAddress: WALLET_A.address,
                tokenName: "PayWiser Token",
                tokenSymbol: "PWSR",
                decimals: 8,
                maxSupply: "10000000.00000000"
            };

            // Ensure config directory exists
            const configDir = path.join(__dirname, '..', 'config');
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }

            const deploymentConfigPath = path.join(configDir, 'deployment.json');
            fs.writeFileSync(deploymentConfigPath, JSON.stringify(deploymentInfo, null, 2));
            console.log(`\n💾 Deployment info saved to: ${deploymentConfigPath}`);

            console.log('\n🎉 PayWiser Token (PWSR) deployed successfully!');
            console.log('\n🔗 View on Sui Explorer:');
            console.log(`https://suiexplorer.com/txblock/${result.digest}?network=testnet`);
            console.log(`https://suiexplorer.com/object/${packageId}?network=testnet`);

            console.log('\n📋 Next Steps:');
            console.log('1. Test minting: node scripts/mint.js');
            console.log('2. Set up NTT bridge: node scripts/setup-ntt.js');
            console.log('3. Verify token info on explorer');

            return deploymentInfo;
            
        } else {
            console.error('❌ Deployment failed:', result);
            throw new Error(`Deployment failed with status: ${result.status || 'unknown'}`);
        }

    } catch (error) {
        console.error('\n❌ Deployment failed:', error.message);
        
        // Clean up any temporary files
        const tempDir = path.join(__dirname, '..', 'temp_sui_config');
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        
        process.exit(1);
    }
}

// Check if local Sui binary is available
try {
    execSync('./sui --version', { 
        stdio: 'ignore',
        cwd: path.join(__dirname, '..')
    });
} catch (error) {
    console.error('❌ Local Sui binary not found in token directory.');
    console.error('Please ensure the Sui binary is available.');
    process.exit(1);
}

// Run deployment
deployToken();
