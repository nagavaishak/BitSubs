import { BitSubsClient } from '../client/subscription-client';
import fetch from 'node-fetch';
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

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDemo() {
  console.log('='.repeat(70));
  console.log('BitSubs: Bitcoin Subscriptions via x402 - Terminal Demo');
  console.log('='.repeat(70));

  // Derive private key from mnemonic
  const privateKey = derivePrivateKey(MNEMONIC);

  const client = new BitSubsClient(
    privateKey,
    CONTRACT_ADDRESS,
    CONTRACT_NAME,
    'testnet'
  );

  try {
    // Step 1: Open channel
    console.log('\n📍 STEP 1: Opening subscription channel');
    console.log('-'.repeat(70));
    console.log(`   Deposit: 1 STX (1,000,000 microSTX)`);
    console.log(`   Rate: 100 microSTX per block (~0.0001 STX/block)`);
    console.log(`   Estimated duration: ~10,000 blocks`);

    await client.openChannel(
      SERVICE_ADDRESS,
      1000000n,  // 1 STX deposit
      100n       // 100 microSTX per block
    );

    console.log('\n   ⏳ Waiting for blockchain confirmation (30 seconds)...');
    await sleep(30000); // Wait ~30s for block confirmation

    // Step 2: Check channel info
    console.log('\n📍 STEP 2: Verifying channel status');
    console.log('-'.repeat(70));

    // Get the subscriber address from the private key
    const { getAddressFromPrivateKey } = require('@stacks/transactions');
    const { StacksTestnet } = require('@stacks/network');
    const network = new StacksTestnet();
    const subscriberAddress = getAddressFromPrivateKey(privateKey, network.version);

    const channelInfo = await client.getChannelInfo(
      subscriberAddress,
      SERVICE_ADDRESS
    );

    if (channelInfo) {
      console.log(`   ✅ Channel active: ${channelInfo.active}`);
      console.log(`   💰 Remaining balance: ${channelInfo.remaining} microSTX`);
      console.log(`   📊 Deposit: ${channelInfo.deposit} microSTX`);
      console.log(`   ⚡ Rate: ${channelInfo.rate} microSTX/block`);
    }

    // Step 3: Make requests to premium API
    console.log('\n📍 STEP 3: Making requests to premium API');
    console.log('-'.repeat(70));
    console.log(`   Subscriber Address: ${subscriberAddress}`);
    console.log(`   Target: ${API_ENDPOINT}/api/premium/*`);

    let successCount = 0;
    let failureCount = 0;
    const maxRequests = 1000;

    console.log(`\n   Starting ${maxRequests} requests...`);

    for (let i = 1; i <= maxRequests; i++) {
      try {
        const endpoints = ['/api/premium/weather', '/api/premium/market-data', '/api/premium/news'];
        const endpoint = endpoints[i % endpoints.length];

        const response = await fetch(`${API_ENDPOINT}${endpoint}`, {
          headers: {
            'x-subscriber-id': subscriberAddress
          }
        });

        if (response.status === 200) {
          const data: any = await response.json();
          successCount++;

          if (i % 100 === 0 || i === 1) {
            console.log(`   ✅ Request ${i}: ${response.status} - ${data.message || 'Success'}`);
          }
        } else if (response.status === 402) {
          const error: any = await response.json();
          console.log(`\n   ❌ Subscription expired at request ${i}`);
          console.log(`   💸 Remaining balance: ${error.remainingBalance}`);
          console.log(`   📝 ${error.message}`);
          failureCount++;
          break;
        } else {
          console.log(`   ⚠️  Request ${i}: Status ${response.status}`);
          failureCount++;
        }

        // Rate limiting: 1 request per second
        await sleep(1000);

      } catch (error: any) {
        console.error(`   ❌ Request ${i} failed:`, error.message);
        failureCount++;
        break;
      }
    }

    // Step 4: Close channel
    console.log(`\n📍 STEP 4: Closing channel and settling`);
    console.log('-'.repeat(70));

    await client.closeChannel(SERVICE_ADDRESS);

    console.log('   ⏳ Waiting for settlement confirmation...');
    await sleep(10000);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('DEMO SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Successful requests: ${successCount}`);
    console.log(`❌ Failed requests: ${failureCount}`);
    console.log(`⛓️  On-chain transactions: 2 (open + close)`);

    if (successCount > 0) {
      const gasEfficiency = ((1 - 2 / successCount) * 100).toFixed(2);
      console.log(`💡 Gas savings: ${gasEfficiency}%`);
      console.log(`🎯 Cost per request: ${2} / ${successCount} on-chain tx`);
    }

    console.log('='.repeat(70));
    console.log('\n🎉 BitSubs Demo Complete!');
    console.log('💡 This demonstrates Bitcoin subscriptions with 99.8% gas reduction');

  } catch (error: any) {
    console.error('\n❌ Demo failed:', error.message);
    console.error('Stack trace:', error);
  }
}

// Run the demo
if (require.main === module) {
  runDemo()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
