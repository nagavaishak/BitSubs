import { privateKeyToAccount } from 'x402-stacks';
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  principalCV,
  uintCV,
} from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

const CONTRACT_ADDRESS = 'ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP';
const CONTRACT_NAME = 'subscription-channel-v2';
const SERVICE_ADDRESS = 'ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP';
const EXPLORER = 'https://explorer.hiro.so/txid';

const AGENT2_KEY = process.env.AGENT2_KEY || '5ed260e0d654e3dbfeec04b4b46825ab87db6a502fa034f97b15e48bfe40f264';
const AGENT3_KEY = process.env.AGENT3_KEY || 'ef32927f5f847104ad58d380eea27db117efdc044fb6fb3e3f9313bae532f490';

const network = new StacksTestnet();
const AGENT2 = privateKeyToAccount(AGENT2_KEY, 'testnet');
const AGENT3 = privateKeyToAccount(AGENT3_KEY, 'testnet');

const DEPOSIT = 1_000_000; // 1 STX
const RATE = 100;          // 100 µSTX per block

async function openChannel(senderKey: string, senderName: string, serviceAddr: string, serviceName: string) {
  console.log(`\n[${senderName}] Opening channel → ${serviceName} (${serviceAddr.slice(0, 10)}...)`);
  console.log(`  Deposit: ${DEPOSIT} µSTX | Rate: ${RATE} µSTX/block`);

  try {
    const tx = await makeContractCall({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'open-channel',
      functionArgs: [
        principalCV(serviceAddr),
        uintCV(DEPOSIT),
        uintCV(RATE),
      ],
      senderKey,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: 0x01, // Allow
    });

    const result = await broadcastTransaction(tx, network);
    const txId = typeof result === 'string' ? result : result.txid;

    if (txId && !txId.includes('error')) {
      console.log(`  TX broadcast: ${EXPLORER}/${txId}?chain=testnet`);
      return txId;
    } else {
      console.log(`  ERROR: ${JSON.stringify(result)}`);
      return null;
    }
  } catch (err: any) {
    console.log(`  ERROR: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  BitSubs Economy — Opening Subscription Channels');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n  Agent 2 (Trading Analyst):   ${AGENT2.address}`);
  console.log(`  Agent 3 (Portfolio Manager): ${AGENT3.address}`);
  console.log(`  Service (Weather Oracle):    ${SERVICE_ADDRESS}`);
  console.log(`  Agent 2 signals service:     ${AGENT2.address}`);

  // Channel 1: Agent 2 → SERVICE_ADDRESS (Weather Oracle premium endpoints)
  const tx1 = await openChannel(
    AGENT2_KEY,
    'Trading Analyst',
    SERVICE_ADDRESS,
    'Weather Oracle'
  );

  // Channel 2: Agent 3 → Agent 2 (Trading Analyst signals)
  const tx2 = await openChannel(
    AGENT3_KEY,
    'Portfolio Manager',
    AGENT2.address,
    'Trading Analyst'
  );

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Results:');
  console.log(`  Channel 1 (Agent2→Weather):  ${tx1 ? 'BROADCAST' : 'FAILED'}`);
  console.log(`  Channel 2 (Agent3→Signals):  ${tx2 ? 'BROADCAST' : 'FAILED'}`);
  console.log('');
  console.log('  Channels take ~2 min to confirm on testnet.');
  console.log('  Once confirmed, the economy dashboard will show ACTIVE.');
  console.log('═══════════════════════════════════════════════════════════');
}

main().catch(console.error);
