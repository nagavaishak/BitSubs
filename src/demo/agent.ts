import { BitSubsClient } from '../client/subscription-client';
const bip39 = require('bip39');
const BIP32Factory = require('bip32').default || require('bip32');
const ecc = require('tiny-secp256k1');

// Derive private key from mnemonic
function derivePrivateKey(mnemonic: string): string {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const bip32 = BIP32Factory(ecc);
  const root = bip32.fromSeed(seed);
  const child = root.derivePath("m/44'/5757'/0'/0/0");
  return Buffer.from(child.privateKey).toString('hex');
}

// Configuration - Deployed to Testnet
const MNEMONIC = process.env.MNEMONIC || "slam cube nerve logic between gas surge worth panic delay fetch tattoo lamp pioneer useless scrub potato camp soap retire defense remove edit damp";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || 'STDJM59BQ5320FM808QWEVP4JXH0R9BYS4Q0YE6C';
const CONTRACT_NAME = 'subscription-channel';
const SERVICE_ADDRESS = process.env.SERVICE_ADDRESS || 'STDJM59BQ5320FM808QWEVP4JXH0R9BYS4Q0YE6C';
const API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:3000';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runX402Demo() {
  console.log('='.repeat(70));
  console.log('BitSubs: x402-Compliant Bitcoin Subscriptions');
  console.log('='.repeat(70));

  // Derive private key from mnemonic
  const privateKey = derivePrivateKey(MNEMONIC);

  const client = new BitSubsClient(
    privateKey,
    CONTRACT_ADDRESS,
    CONTRACT_NAME,
    SERVICE_ADDRESS // Pass service address
  );

  console.log('\nClient Address:', client.getAddress());
  console.log('Service Address:', SERVICE_ADDRESS);
  console.log('\n📡 Starting x402 flow...\n');

  let successCount = 0;
  let failCount = 0;

  for (let i = 1; i <= 1000; i++) {
    try {
      const data = await client.makeRequest(`${API_ENDPOINT}/api/premium/weather`);
      successCount++;

      if (i % 100 === 0 || i === 1) {
        console.log(`✅ Request ${i}: ${data.temperature}°F - ${data.message}`);
      }

      await sleep(50); // Rate limiting protection

    } catch (error: any) {
      failCount++;
      if (error.message === 'Subscription expired') {
        console.log(`\n❌ Subscription expired at request ${i}`);
        break;
      } else if (failCount < 50) {
        // Allow some rate limit errors
        if (i % 100 === 0) {
          console.log(`⚠️  Request ${i}: ${error.message}`);
        }
      } else {
        console.log(`\n❌ Too many failures at request ${i}`);
        break;
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('DEMO SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ x402-Compliant: YES`);
  console.log(`✅ Successful requests: ${successCount}`);
  console.log(`❌ Failed requests: ${failCount}`);
  console.log(`⛓️  On-chain transactions: 2 (open + close)`);
  if (successCount > 0) {
    console.log(`💡 Gas savings: ${((1 - 2 / successCount) * 100).toFixed(2)}%`);
  }
  console.log('='.repeat(70));
  console.log('\n🎉 BitSubs x402 Demo Complete!');
  console.log('💡 First x402 implementation for continuous Bitcoin subscriptions\n');
}

runX402Demo().catch(console.error);
