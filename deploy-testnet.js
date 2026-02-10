const {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  getNonce,
  getAddressFromPrivateKey,
} = require('@stacks/transactions');
const { StacksTestnet } = require('@stacks/network');
const fs = require('fs');

// Direct private key approach - we'll compute from mnemonic
const MNEMONIC = "slam cube nerve logic between gas surge worth panic delay fetch tattoo lamp pioneer useless scrub potato camp soap retire defense remove edit damp";
const CONTRACT_NAME = 'subscription-channel';
const CONTRACT_PATH = './bitsubs/contracts/subscription-channel.clar';

// Simple key derivation using Node.js crypto
async function deriveKeyFromMnemonic(mnemonic) {
  const bip39 = require('bip39');
  const BIP32Factory = require('bip32').default || require('bip32');
  const ecc = require('tiny-secp256k1');
  const bip32 = BIP32Factory(ecc);

  // Convert mnemonic to seed
  const seed = bip39.mnemonicToSeedSync(mnemonic);

  // Derive using Stacks path: m/44'/5757'/0'/0/0
  const root = bip32.fromSeed(seed);
  const child = root.derivePath("m/44'/5757'/0'/0/0");

  // Convert Buffer to hex string properly
  if (!child.privateKey) {
    throw new Error('Failed to derive private key');
  }

  return Buffer.from(child.privateKey).toString('hex');
}

async function deployContract() {
  try {
    console.log('🚀 Deploying BitSubs contract to Stacks Testnet...\n');

    const network = new StacksTestnet();

    // Read contract source
    const contractSource = fs.readFileSync(CONTRACT_PATH, 'utf8');
    console.log(`📄 Contract: ${CONTRACT_NAME}`);
    console.log(`📏 Size: ${contractSource.length} bytes\n`);

    // Derive private key from mnemonic
    console.log('🔑 Deriving keys from mnemonic...');
    const privateKey = await deriveKeyFromMnemonic(MNEMONIC);
    console.log(`Private key length: ${privateKey.length} chars`);

    // Ensure private key is properly formatted (64 hex chars)
    const paddedKey = privateKey.padStart(64, '0');
    console.log(`Formatted private key: ${paddedKey.substring(0, 10)}...`);

    const address = getAddressFromPrivateKey(paddedKey, network.version);
    console.log(`✓ Deployer address: ${address}\n`);

    // Get nonce
    console.log('⏳ Fetching account nonce...');
    let nonce;
    try {
      nonce = await getNonce(address, network);
      console.log(`✓ Nonce: ${nonce}\n`);
    } catch (e) {
      console.log('⚠️  Using nonce 0 (first transaction)');
      nonce = 0n;
    }

    // Create deployment transaction
    console.log('📝 Creating deployment transaction...');
    const txOptions = {
      contractName: CONTRACT_NAME,
      codeBody: contractSource,
      senderKey: paddedKey,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      nonce,
      fee: 100000n, // 0.1 STX fee for safety
    };

    const transaction = await makeContractDeploy(txOptions);
    console.log(`✓ Transaction created\n`);

    // Broadcast transaction
    console.log('📡 Broadcasting to testnet...');
    const broadcastResponse = await broadcastTransaction(transaction, network);

    if (broadcastResponse.error) {
      console.error(`\n❌ Deployment failed: ${broadcastResponse.error}`);
      if (broadcastResponse.reason) {
        console.error(`Reason: ${broadcastResponse.reason}`);
      }
      if (broadcastResponse.reason_data) {
        console.error(`Details: ${JSON.stringify(broadcastResponse.reason_data, null, 2)}`);
      }
      process.exit(1);
    }

    const txId = typeof broadcastResponse === 'string' ? broadcastResponse : broadcastResponse.txid;

    console.log('\n✅ Contract deployed successfully!\n');
    console.log('='.repeat(70));
    console.log(`Transaction ID: ${txId}`);
    console.log(`Contract: ${address}.${CONTRACT_NAME}`);
    console.log(`Explorer: https://explorer.hiro.so/txid/${txId}?chain=testnet`);
    console.log('='.repeat(70));
    console.log('\n⏳ Waiting for confirmation (usually 10-30 minutes)...');
    console.log(`Check status: https://explorer.hiro.so/txid/${txId}?chain=testnet\n`);

    // Save deployment info
    const deploymentInfo = {
      network: 'testnet',
      contractAddress: address,
      contractName: CONTRACT_NAME,
      fullyQualifiedContractId: `${address}.${CONTRACT_NAME}`,
      txId,
      timestamp: new Date().toISOString(),
      explorerUrl: `https://explorer.hiro.so/txid/${txId}?chain=testnet`
    };

    fs.writeFileSync(
      './deployment-info.json',
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log('💾 Deployment info saved to deployment-info.json\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Deployment error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    console.error(error);
    process.exit(1);
  }
}

deployContract();
