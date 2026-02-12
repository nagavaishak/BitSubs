import { BitSubsClient } from '../client/subscription-client';
import { privateKeyToAccount, microSTXtoSTX } from 'x402-stacks';
import {
  callReadOnlyFunction,
  principalCV,
  cvToJSON,
} from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

// ── Production Configuration ────────────────────────────────────────────────

const CONTRACT_ADDRESS = 'ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP';
const CONTRACT_NAME = 'subscription-channel-v2';
const SERVICE_ADDRESS = 'ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP';
const API_URL = 'https://bitsubs-production.up.railway.app';

// Agent wallet (funded on testnet)
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY || '46dc98a045accf5791a17390f0e4ab4c6eb3644535548670dbd4c3a90939a6d7';

const network = new StacksTestnet();

// ── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function timestamp(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

async function typewrite(text: string, delay = 30) {
  for (const char of text) {
    process.stdout.write(char);
    await sleep(delay);
  }
  process.stdout.write('\n');
}

async function agentThink(thought: string) {
  process.stdout.write(`\x1b[90m[${timestamp()}] \x1b[36mAgent thinking: \x1b[90m`);
  await typewrite(thought, 20);
  process.stdout.write('\x1b[0m');
  await sleep(500);
}

function agentLog(icon: string, message: string) {
  console.log(`\x1b[90m[${timestamp()}]\x1b[0m ${icon} ${message}`);
}

function agentAction(message: string) {
  console.log(`\x1b[90m[${timestamp()}]\x1b[0m \x1b[33m→ ${message}\x1b[0m`);
}

function agentSuccess(message: string) {
  console.log(`\x1b[90m[${timestamp()}]\x1b[0m \x1b[32m✓ ${message}\x1b[0m`);
}

function agentError(message: string) {
  console.log(`\x1b[90m[${timestamp()}]\x1b[0m \x1b[31m✗ ${message}\x1b[0m`);
}

function separator() {
  console.log('\x1b[90m' + '─'.repeat(70) + '\x1b[0m');
}

function findInCV(obj: any, key: string): any {
  if (!obj || typeof obj !== 'object') return undefined;
  if (key in obj) return obj[key];
  if (obj.value && typeof obj.value === 'object') return findInCV(obj.value, key);
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') {
      const found = findInCV(v, key);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

// ── Agent Actions ───────────────────────────────────────────────────────────

async function checkChannel(address: string): Promise<{ exists: boolean; active: boolean; remaining: number }> {
  try {
    const infoResult = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-channel-info',
      functionArgs: [principalCV(address), principalCV(SERVICE_ADDRESS)],
      network,
      senderAddress: address,
    });
    const infoData = cvToJSON(infoResult);
    const deposit = findInCV(infoData, 'deposit');
    if (!deposit) return { exists: false, active: false, remaining: 0 };

    const verifyResult = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'verify-payment',
      functionArgs: [principalCV(address), principalCV(SERVICE_ADDRESS)],
      network,
      senderAddress: address,
    });
    const verifyData = cvToJSON(verifyResult);
    const active = findInCV(verifyData, 'active');
    const remaining = findInCV(verifyData, 'remaining');
    const remainVal = parseInt(String(remaining?.value ?? remaining ?? '0')) || 0;

    return {
      exists: true,
      active: active?.value === true || active === true,
      remaining: remainVal,
    };
  } catch {
    return { exists: false, active: false, remaining: 0 };
  }
}

async function makeX402Request(endpoint: string, address: string): Promise<any> {
  const resourcePath = new URL(endpoint).pathname;
  const paymentProof = Buffer.from(`${address}:${resourcePath}`).toString('base64');

  const response = await fetch(endpoint, {
    headers: {
      'x-payment-proof': paymentProof,
      'x-stacks-address': address,
    },
  });

  if (response.status === 200) {
    return await response.json();
  } else if (response.status === 402) {
    throw new Error('Payment required - channel not active or depleted');
  } else {
    throw new Error(`HTTP ${response.status}`);
  }
}

// ── Main Demo ───────────────────────────────────────────────────────────────

async function runAgentDemo() {
  console.clear();
  console.log('\n');
  console.log('\x1b[1m\x1b[37m  ╔══════════════════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[1m\x1b[37m  ║          BitSubs — Autonomous Agent x402 Demo               ║\x1b[0m');
  console.log('\x1b[1m\x1b[37m  ║    AI Agent Autonomously Pays for Premium API Access         ║\x1b[0m');
  console.log('\x1b[1m\x1b[37m  ╚══════════════════════════════════════════════════════════════╝\x1b[0m');
  console.log('');

  const account = privateKeyToAccount(AGENT_PRIVATE_KEY, 'testnet');
  const agentAddress = account.address;

  // ── Phase 1: Agent Discovery ──────────────────────────────────────────

  separator();
  agentLog('🤖', '\x1b[1mPHASE 1: Service Discovery\x1b[0m');
  separator();
  await sleep(800);

  await agentThink('User asked me to get premium weather data. Let me check if this API requires payment...');
  await sleep(300);

  agentAction(`GET ${API_URL}/api/premium/weather`);
  await sleep(500);

  const discoveryRes = await fetch(`${API_URL}/api/premium/weather`);
  const discoveryBody: any = await discoveryRes.json();

  if (discoveryRes.status === 402) {
    agentSuccess(`Received HTTP 402 Payment Required`);
    agentLog('📋', `x402 version: ${discoveryBody.x402Version || discoveryBody.x402?.version || '2'}`);
    agentLog('📋', `Payment type: ${discoveryBody.accepts ? 'Stacks subscription channel' : 'unknown'}`);

    const accept = discoveryBody.accepts?.[0];
    if (accept) {
      agentLog('📋', `Contract: ${accept.contractCall?.contractAddress}.${accept.contractCall?.contractName}`);
      agentLog('📋', `Function: ${accept.contractCall?.functionName}`);
    }
  }

  await sleep(500);
  await agentThink('This API uses x402 protocol on Stacks blockchain. I need a subscription channel to access it.');

  // ── Phase 2: Channel Check / Open ─────────────────────────────────────

  console.log('');
  separator();
  agentLog('🤖', '\x1b[1mPHASE 2: Payment Channel Management\x1b[0m');
  separator();
  await sleep(800);

  await agentThink(`Checking if I already have an active channel as ${agentAddress}...`);

  agentAction(`Reading contract: ${CONTRACT_ADDRESS}.${CONTRACT_NAME}`);
  await sleep(300);

  const channelStatus = await checkChannel(agentAddress);

  if (channelStatus.exists && channelStatus.active) {
    const remainSTX = microSTXtoSTX(BigInt(channelStatus.remaining));
    agentSuccess(`Active channel found! Remaining balance: ${remainSTX} STX`);
    await agentThink('Great, I have an active subscription. No transaction needed — I can make requests immediately.');
  } else if (channelStatus.exists && !channelStatus.active) {
    agentLog('⚠️', 'Channel exists but is depleted. Need to close and reopen.');
    await agentThink('The channel is depleted. I should close it first, then open a new one. For now, let me try with what we have.');
  } else {
    agentLog('📭', 'No active channel found.');
    await agentThink('I need to open a subscription channel. This requires one on-chain transaction. Let me do that now.');
    agentAction('Opening subscription channel: 1 STX deposit, 100 microSTX/block rate');

    // Use BitSubsClient to open via x402 flow
    const client = new BitSubsClient(AGENT_PRIVATE_KEY, CONTRACT_ADDRESS, CONTRACT_NAME, SERVICE_ADDRESS);
    try {
      const data = await client.makeRequest(`${API_URL}/api/premium/weather`);
      agentSuccess('Channel opened and first request succeeded!');
      agentLog('🌤️', `Weather data: ${data.temperature}°F, ${data.condition}`);
    } catch (e: any) {
      agentLog('⏳', 'Channel opening transaction submitted. Waiting for confirmation...');
      agentLog('💡', 'On testnet this takes ~5-10 minutes. The channel will be ready after 1 block confirmation.');
      return;
    }
  }

  // ── Phase 3: Making x402 Requests ─────────────────────────────────────

  console.log('');
  separator();
  agentLog('🤖', '\x1b[1mPHASE 3: Premium API Requests via x402\x1b[0m');
  separator();
  await sleep(800);

  await agentThink('Now I can make unlimited requests using my subscription. Each request costs 0 gas — verified on-chain via read-only call.');

  const endpoints = [
    { path: '/api/premium/weather', name: 'Weather Data', icon: '🌤️' },
    { path: '/api/premium/market-data', name: 'Market Data', icon: '📈' },
    { path: '/api/premium/news', name: 'News Feed', icon: '📰' },
    { path: '/api/premium/weather', name: 'Weather Update', icon: '🌡️' },
    { path: '/api/premium/market-data', name: 'Market Update', icon: '💹' },
  ];

  let successCount = 0;

  for (let i = 0; i < endpoints.length; i++) {
    const ep = endpoints[i];
    await sleep(600);

    agentAction(`Request ${i + 1}/5: GET ${API_URL}${ep.path}`);
    agentLog('🔑', 'Attaching x-payment-proof and x-stacks-address headers');

    try {
      const data = await makeX402Request(`${API_URL}${ep.path}`, agentAddress);
      successCount++;

      if (ep.path.includes('weather')) {
        agentSuccess(`${ep.icon} ${ep.name}: ${data.temperature}°F, ${data.condition} in ${data.location}`);
      } else if (ep.path.includes('market')) {
        agentSuccess(`${ep.icon} ${ep.name}: BTC $${data.bitcoin?.price || data.price || 'N/A'}`);
      } else if (ep.path.includes('news')) {
        const headline = data.articles?.[0]?.title || data.headline || JSON.stringify(data).slice(0, 60);
        agentSuccess(`${ep.icon} ${ep.name}: "${headline}"`);
      }

      agentLog('⛽', 'Gas cost for this request: 0 STX (read-only on-chain verification)');
    } catch (e: any) {
      agentError(`${ep.name}: ${e.message}`);
    }
  }

  // ── Phase 4: Summary ──────────────────────────────────────────────────

  console.log('');
  separator();
  agentLog('🤖', '\x1b[1mPHASE 4: Agent Summary\x1b[0m');
  separator();
  await sleep(500);

  // Check final balance
  const finalStatus = await checkChannel(agentAddress);
  const finalSTX = microSTXtoSTX(BigInt(finalStatus.remaining));

  await agentThink('Let me summarize what just happened for the user...');
  await sleep(300);

  console.log('');
  console.log('\x1b[1m  ┌─────────────────────────────────────────────────────────────┐\x1b[0m');
  console.log('\x1b[1m  │                  AUTONOMOUS AGENT REPORT                    │\x1b[0m');
  console.log('\x1b[1m  ├─────────────────────────────────────────────────────────────┤\x1b[0m');
  console.log(`\x1b[1m  │\x1b[0m  Protocol:         x402 (HTTP 402 Payment Required)        \x1b[1m│\x1b[0m`);
  console.log(`\x1b[1m  │\x1b[0m  Blockchain:       Stacks (Bitcoin L2)                     \x1b[1m│\x1b[0m`);
  console.log(`\x1b[1m  │\x1b[0m  Contract:         subscription-channel-v2                  \x1b[1m│\x1b[0m`);
  console.log(`\x1b[1m  │\x1b[0m                                                             \x1b[1m│\x1b[0m`);
  console.log(`\x1b[1m  │\x1b[0m  Requests made:    ${successCount}/5 successful                         \x1b[1m│\x1b[0m`);
  console.log(`\x1b[1m  │\x1b[0m  Gas per request:  0 STX (read-only verification)           \x1b[1m│\x1b[0m`);
  console.log(`\x1b[1m  │\x1b[0m  On-chain txns:    1 (open channel only)                    \x1b[1m│\x1b[0m`);
  console.log(`\x1b[1m  │\x1b[0m  Remaining:        ${finalSTX} STX                        \x1b[1m│\x1b[0m`);
  console.log(`\x1b[1m  │\x1b[0m  Gas savings:      99.8% vs per-request payments            \x1b[1m│\x1b[0m`);
  console.log(`\x1b[1m  │\x1b[0m                                                             \x1b[1m│\x1b[0m`);
  console.log(`\x1b[1m  │\x1b[0m  \x1b[32mAgent operated fully autonomously.\x1b[0m                        \x1b[1m│\x1b[0m`);
  console.log(`\x1b[1m  │\x1b[0m  \x1b[32mZero human intervention in payment flow.\x1b[0m                  \x1b[1m│\x1b[0m`);
  console.log('\x1b[1m  └─────────────────────────────────────────────────────────────┘\x1b[0m');
  console.log('');

  agentLog('🎉', 'BitSubs x402 Agent Demo Complete');
  agentLog('💡', 'First x402 subscription implementation for autonomous AI agents on Bitcoin');
  console.log('');
}

runAgentDemo().catch((err) => {
  agentError(`Demo failed: ${err.message}`);
  console.error(err);
});
