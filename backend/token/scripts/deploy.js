#!/usr/bin/env node

/**
 * PayWiser Token Deployment Script
 * Deploys the PayWiser Token contract to Sui testnet
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying PayWiser Token...\n');

async function deployToken() {
    try {
        // Step 1: Build the Move package
        console.log('📦 Building Move package...');
        execSync('sui move build', { 
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
        console.log('✅ Build successful!\n');

        // Step 2: Deploy to testnet
        console.log('🌐 Publishing to Sui testnet...');
        const publishOutput = execSync('sui client publish --gas-budget 100000000 --json', {
            encoding: 'utf8',
            cwd: path.join(__dirname, '..')
        });

        const publishResult = JSON.parse(publishOutput);
        
        if (publishResult.status === 'success') {
            console.log('✅ Deployment successful!\n');
            
            // Extract important information
            const packageId = publishResult.objectChanges.find(
                change => change.type === 'published'
            )?.packageId;

            const treasuryCapId = publishResult.objectChanges.find(
                change => change.objectType?.includes('TreasuryCap')
            )?.objectId;

            const tokenInfoId = publishResult.objectChanges.find(
                change => change.objectType?.includes('TokenInfo')
            )?.objectId;

            const mintCapId = publishResult.objectChanges.find(
                change => change.objectType?.includes('MintCap')
            )?.objectId;

            // Save deployment info
            const deploymentInfo = {
                packageId,
                treasuryCapId,
                tokenInfoId,
                mintCapId,
                deployedAt: new Date().toISOString(),
                network: 'testnet',
                transactionDigest: publishResult.digest
            };

            const configPath = path.join(__dirname, '..', 'config', 'deployment.json');
            fs.writeFileSync(configPath, JSON.stringify(deploymentInfo, null, 2));

            console.log('📋 Deployment Information:');
            console.log(`Package ID: ${packageId}`);
            console.log(`Treasury Cap ID: ${treasuryCapId}`);
            console.log(`Token Info ID: ${tokenInfoId}`);
            console.log(`Mint Cap ID: ${mintCapId}`);
            console.log(`Transaction: ${publishResult.digest}`);
            console.log(`\n💾 Saved to: ${configPath}\n`);

            // Generate token configuration
            const tokenConfig = {
                name: "PayWiser Token",
                symbol: "PWSR",
                decimals: 8,
                maxSupply: "10000000.00000000",
                description: "The native token for PayWiser ecosystem - enabling face recognition payments and cross-chain transfers via Wormhole NTT",
                iconUrl: "https://paywiser.com/token-icon.png",
                ...deploymentInfo
            };

            const tokenConfigPath = path.join(__dirname, '..', 'config', 'token-config.json');
            fs.writeFileSync(tokenConfigPath, JSON.stringify(tokenConfig, null, 2));
            console.log(`📝 Token config saved to: ${tokenConfigPath}\n`);

            console.log('🎉 PayWiser Token deployed successfully!');
            console.log('Next steps:');
            console.log('1. Run: node scripts/mint.js (to mint initial supply)');
            console.log('2. Run: node scripts/setup-ntt.js (to set up Wormhole NTT)');

        } else {
            console.error('❌ Deployment failed:', publishResult);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Error during deployment:', error.message);
        if (error.stdout) {
            console.error('Output:', error.stdout.toString());
        }
        if (error.stderr) {
            console.error('Error:', error.stderr.toString());
        }
        process.exit(1);
    }
}

// Check if Sui CLI is available
try {
    execSync('sui --version', { stdio: 'ignore' });
} catch (error) {
    console.error('❌ Sui CLI not found. Please install Sui CLI first.');
    console.error('Installation: https://docs.sui.io/guides/developer/getting-started/sui-install');
    process.exit(1);
}

// Run deployment
deployToken();
