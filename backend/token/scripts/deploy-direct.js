#!/usr/bin/env node

/**
 * Direct PayWiser Token Deployment
 * Uses Sui CLI with temporary key import
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Wallet A (Gas Sponsor) details
const WALLET_A = {
    privateKey: '3GInch4KuXu922aU4qCs9PmXgE59c/4S73OtzDStYVM=',
    address: '0xcb3fced2337776c984f220f27e97428f426f80e5b771a3e467b2d6f14597929c'
};

console.log('🚀 Deploying PayWiser Token directly...\n');

async function deployToken() {
    try {
        console.log(`🔑 Using wallet: ${WALLET_A.address}`);
        
        // Step 1: Build the Move package
        console.log('\n📦 Building Move package...');
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

        // Step 2: Create temporary keystore and switch environment
        const tempKeystoreDir = path.join(__dirname, '..', 'temp_keystore');
        const tempKeystorePath = path.join(tempKeystoreDir, 'sui.keystore');
        
        // Clean up any existing temp directory
        if (fs.existsSync(tempKeystoreDir)) {
            fs.rmSync(tempKeystoreDir, { recursive: true, force: true });
        }
        
        fs.mkdirSync(tempKeystoreDir, { recursive: true });

        // Create keystore with the private key in Ed25519 format
        const keystoreContent = [`suiprivkey1q${WALLET_A.privateKey}`];
        fs.writeFileSync(tempKeystorePath, JSON.stringify(keystoreContent));

        console.log('📦 Publishing to Sui testnet...');
        
        // Step 3: Use Sui CLI with temporary keystore
        const suiConfigDir = path.join(tempKeystoreDir, 'config');
        fs.mkdirSync(suiConfigDir, { recursive: true });
        
        const commands = [
            `export SUI_CONFIG_DIR=${suiConfigDir}`,
            `./sui client new-env --alias temp-testnet --rpc https://fullnode.testnet.sui.io:443`,
            `./sui client switch --env temp-testnet`,
            `echo '${JSON.stringify([WALLET_A.privateKey])}' > ${tempKeystorePath}`,
            `./sui client publish --gas-budget 100000000 --json`
        ];
        
        const fullCommand = commands.join(' && ');
        
        let publishOutput;
        try {
            publishOutput = execSync(fullCommand, {
                encoding: 'utf8',
                cwd: path.join(__dirname, '..'),
                shell: '/bin/bash',
                env: {
                    ...process.env,
                    SUI_CONFIG_DIR: suiConfigDir,
                    SUI_KEYSTORE_PATH: tempKeystorePath
                }
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
        } finally {
            // Clean up temporary files
            if (fs.existsSync(tempKeystoreDir)) {
                fs.rmSync(tempKeystoreDir, { recursive: true, force: true });
            }
        }

        console.log('✅ Deployment successful!\n');

        // Try to parse the result (it might be mixed with other output)
        const lines = publishOutput.split('\n');
        let jsonResult = null;
        
        for (const line of lines) {
            if (line.trim().startsWith('{')) {
                try {
                    jsonResult = JSON.parse(line.trim());
                    break;
                } catch (e) {
                    // Continue looking for valid JSON
                }
            }
        }

        if (!jsonResult) {
            // Look for the last JSON-like line
            const jsonLines = lines.filter(line => line.includes('"digest"') || line.includes('"status"'));
            if (jsonLines.length > 0) {
                try {
                    jsonResult = JSON.parse(jsonLines[jsonLines.length - 1]);
                } catch (e) {
                    console.log('Raw output:', publishOutput);
                    throw new Error('Could not parse deployment result');
                }
            } else {
                console.log('Raw output:', publishOutput);
                throw new Error('Could not find JSON result in output');
            }
        }

        const result = jsonResult;
        
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
        const tempKeystoreDir = path.join(__dirname, '..', 'temp_keystore');
        if (fs.existsSync(tempKeystoreDir)) {
            fs.rmSync(tempKeystoreDir, { recursive: true, force: true });
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
    console.log('✅ Sui CLI found');
} catch (error) {
    console.error('❌ Local Sui binary not found in token directory.');
    console.error('Please ensure the Sui binary is available.');
    process.exit(1);
}

// Run deployment
deployToken();

