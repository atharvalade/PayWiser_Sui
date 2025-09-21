#!/usr/bin/env node

/**
 * PayWiser Token Minting Script
 * Mints initial supply of PayWiser Tokens
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🪙 Minting PayWiser Tokens...\n');

async function mintTokens() {
    try {
        // Load deployment configuration
        const configPath = path.join(__dirname, '..', 'config', 'deployment.json');
        if (!fs.existsSync(configPath)) {
            console.error('❌ Deployment config not found. Please run deploy.js first.');
            process.exit(1);
        }

        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('📋 Using deployment config:');
        console.log(`Package ID: ${config.packageId}`);
        console.log(`Treasury Cap ID: ${config.treasuryCapId}`);
        console.log(`Token Info ID: ${config.tokenInfoId}\n`);

        // Get current address
        const addressOutput = execSync('sui client active-address', { encoding: 'utf8' });
        const currentAddress = addressOutput.trim();
        console.log(`👤 Minting to address: ${currentAddress}\n`);

        // Mint initial supply (1 million tokens = 100000000000000 with 8 decimals)
        const mintAmount = '100000000000000'; // 1,000,000 PWSR
        const readableAmount = '1,000,000.00000000';

        console.log(`💰 Minting ${readableAmount} PWSR tokens...`);

        const mintCommand = `sui client call ` +
            `--package ${config.packageId} ` +
            `--module paywiser_token ` +
            `--function mint ` +
            `--args ${config.treasuryCapId} ${config.tokenInfoId} ${mintAmount} ${currentAddress} ` +
            `--gas-budget 10000000 ` +
            `--json`;

        console.log('🔄 Executing mint transaction...');
        const mintOutput = execSync(mintCommand, { encoding: 'utf8' });
        const mintResult = JSON.parse(mintOutput);

        if (mintResult.status === 'success') {
            console.log('✅ Minting successful!\n');

            // Find the minted coin object
            const mintedCoin = mintResult.objectChanges.find(
                change => change.type === 'created' && 
                change.objectType?.includes('Coin') &&
                change.objectType?.includes('PAYWISER_TOKEN')
            );

            if (mintedCoin) {
                console.log('🪙 Minted Coin Details:');
                console.log(`Coin Object ID: ${mintedCoin.objectId}`);
                console.log(`Amount: ${readableAmount} PWSR`);
                console.log(`Owner: ${currentAddress}`);
            }

            console.log(`Transaction Digest: ${mintResult.digest}`);
            console.log(`Gas Used: ${mintResult.effects.gasUsed.computationCost + mintResult.effects.gasUsed.storageCost}`);

            // Update config with mint info
            config.initialMint = {
                amount: mintAmount,
                readableAmount: readableAmount,
                recipient: currentAddress,
                coinObjectId: mintedCoin?.objectId,
                transactionDigest: mintResult.digest,
                mintedAt: new Date().toISOString()
            };

            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log('\n💾 Updated deployment config with mint information');

            console.log('\n🎉 PayWiser Tokens minted successfully!');
            console.log('Next steps:');
            console.log('1. Check balance: sui client balance');
            console.log('2. Set up NTT: node scripts/setup-ntt.js');

        } else {
            console.error('❌ Minting failed:', mintResult);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Error during minting:', error.message);
        if (error.stdout) {
            console.error('Output:', error.stdout.toString());
        }
        if (error.stderr) {
            console.error('Error:', error.stderr.toString());
        }
        process.exit(1);
    }
}

// Check if deployment exists
const configPath = path.join(__dirname, '..', 'config', 'deployment.json');
if (!fs.existsSync(configPath)) {
    console.error('❌ No deployment found. Please run deploy.js first.');
    process.exit(1);
}

// Run minting
mintTokens();

