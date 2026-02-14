import { BitSubsClient } from '../client/subscription-client';
import { privateKeyToAccount, microSTXtoSTX } from 'x402-stacks';
import {
  callReadOnlyFunction,
  principalCV,
  cvToJSON,
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
} from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

// ── Configuration ───────────────────────────────────────────────────────────

const CONTRACT_ADDRESS = 'ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP';
const CONTRACT_NAME = 'subscription-channel-v2';
const SERVICE_ADDRESS = 'ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP';
const API_URL = 'https://bitsubs-production.up.railway.app';
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY || '46dc98a045accf5791a17390f0e4ab4c6eb3644535548670dbd4c3a90939a6d7';
const EXPLORER_BASE = 'https://explorer.hiro.so/txid';

const network = new StacksTestnet();

// ── Terminal Formatting ─────────────────────────────────────────────────────

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[90m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

const startTime = Date.now();

function elapsed(): string {
  const ms = Date.now() - startTime;
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function log(icon: string, msg: string) {
  console.log(`${C.dim}[${elapsed()}]${C.reset} ${icon} ${msg}`);
}

function logSuccess(msg: string) {
  console.log(`${C.dim}[${elapsed()}]${C.reset} ${C.green}✅ ${msg}${C.reset}`);
}

function logWarn(msg: string) {
  console.log(`${C.dim}[${elapsed()}]${C.reset} ${C.yellow}⚠️  ${msg}${C.reset}`);
}

function logError(msg: string) {
  console.log(`${C.dim}[${elapsed()}]${C.reset} ${C.red}❌ ${msg}${C.reset}`);
}

function logAction(msg: string) {
  console.log(`${C.dim}[${elapsed()}]${C.reset} ${C.cyan}→ ${msg}${C.reset}`);
}

function balanceBar(remaining: number, total: number): string {
  const pct = Math.max(0, Math.min(1, remaining / total));
  const width = 30;
  const filled = Math.round(pct * width);
  const empty = width - filled;
  const color = pct > 0.3 ? C.green : pct > 0.1 ? C.yellow : C.red;
  const bar = color + '█'.repeat(filled) + C.dim + '░'.repeat(empty) + C.reset;
  const pctStr = (pct * 100).toFixed(1) + '%';
  return `[${bar}] ${pctStr}`;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

// ── Blockchain Helpers ──────────────────────────────────────────────────────

async function checkChannel(address: string): Promise<{ exists: boolean; active: boolean; remaining: number; deposit: number }> {
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
    if (!deposit) return { exists: false, active: false, remaining: 0, deposit: 0 };
    const depositVal = parseInt(String(deposit?.value ?? deposit ?? '0')) || 0;

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
      deposit: depositVal,
    };
  } catch {
    return { exists: false, active: false, remaining: 0, deposit: 0 };
  }
}

async function makeX402Request(endpoint: string, address: string): Promise<{ ok: boolean; data?: any; status: number }> {
  const resourcePath = new URL(endpoint).pathname;
  const paymentProof = Buffer.from(`${address}:${resourcePath}`).toString('base64');

  const response = await fetch(endpoint, {
    headers: {
      'x-payment-proof': paymentProof,
      'x-stacks-address': address,
    },
  });

  if (response.status === 200) {
    return { ok: true, data: await response.json(), status: 200 };
  }
  return { ok: false, status: response.status };
}

async function closeChannel(privateKey: string, address: string): Promise<string | null> {
  try {
    const txOptions = {
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'close-channel',
      functionArgs: [principalCV(SERVICE_ADDRESS)],
      senderKey: privateKey,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: 0x02, // Allow
    };

    const transaction = await makeContractCall(txOptions);
    const broadcastResponse = await broadcastTransaction(transaction, network);
    const txId = typeof broadcastResponse === 'string' ? broadcastResponse : broadcastResponse.txid;
    return txId;
  } catch {
    return null;
  }
}

// ── Main Demo ───────────────────────────────────────────────────────────────

async function runAgentDemo() {
  console.clear();

  // ── Banner ──────────────────────────────────────────────────────────────
  console.log('');
  console.log(`${C.bold}${C.white}  ═══════════════════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.bold}${C.white}    BitSubs Autonomous Agent v1.0${C.reset}`);
  console.log(`${C.bold}${C.white}    Protocol: x402 v2 on Stacks${C.reset}`);
  console.log(`${C.bold}${C.white}    Settlement: Bitcoin (via STX/sBTC)${C.reset}`);
  console.log(`${C.bold}${C.white}  ═══════════════════════════════════════════════════════════════${C.reset}`);
  console.log('');

  const account = privateKeyToAccount(AGENT_PRIVATE_KEY, 'testnet');
  const agentAddress = account.address;

  log('🤖', `${C.bold}Agent initialized.${C.reset} Wallet: ${C.cyan}${agentAddress}${C.reset}`);
  await sleep(500);

  // ── Phase 1: Discovery ──────────────────────────────────────────────────

  log('📡', `GET ${API_URL}/api/premium/weather`);
  await sleep(300);

  const discoveryRes = await fetch(`${API_URL}/api/premium/weather`);
  const discoveryBody: any = await discoveryRes.json();

  if (discoveryRes.status === 402) {
    logSuccess(`HTTP 402 Payment Required`);
    log('💰', `${C.yellow}Reading x402 payment instructions...${C.reset}`);
    await sleep(300);

    const accept = discoveryBody.accepts?.[0];
    if (accept) {
      log('📋', `Scheme: ${C.cyan}${accept.scheme}${C.reset}`);
      log('📋', `Token: ${C.cyan}${accept.token}${C.reset} | Amount: ${C.cyan}${accept.amount}${C.reset} microSTX`);
      log('📋', `Contract: ${C.dim}${accept.contractCall?.contractAddress}.${accept.contractCall?.contractName}${C.reset}`);
      log('📋', `Function: ${C.cyan}${accept.contractCall?.functionName}${C.reset}`);
    }
  }

  await sleep(500);

  // ── Phase 2: Channel Management ─────────────────────────────────────────

  console.log('');
  log('🔍', `${C.bold}Checking for existing subscription channel...${C.reset}`);
  await sleep(300);

  let channelStatus = await checkChannel(agentAddress);
  let channelTxId: string | null = null;

  if (channelStatus.exists && channelStatus.active) {
    const remainSTX = microSTXtoSTX(BigInt(channelStatus.remaining));
    logSuccess(`Active channel found! Balance: ${C.green}${remainSTX} STX${C.reset}`);
    log('📊', `${balanceBar(channelStatus.remaining, channelStatus.deposit)}`);
  } else if (channelStatus.exists && !channelStatus.active) {
    logWarn(`Channel depleted. Closing old channel first...`);
    const closeTx = await closeChannel(AGENT_PRIVATE_KEY, agentAddress);
    if (closeTx) {
      log('🔒', `Close TX: ${C.cyan}${closeTx}${C.reset}`);
      log('🔗', `${C.dim}${EXPLORER_BASE}/${closeTx}?chain=testnet${C.reset}`);
      log('⏳', 'Waiting for close confirmation...');
      await sleep(15000);
    }
    // Open new channel
    channelStatus = { exists: false, active: false, remaining: 0, deposit: 0 };
  }

  if (!channelStatus.exists || !channelStatus.active) {
    log('📭', 'No active channel detected.');
    logAction(`Opening subscription channel (1 STX deposit, 100 µSTX/block)...`);
    await sleep(300);

    const client = new BitSubsClient(AGENT_PRIVATE_KEY, CONTRACT_ADDRESS, CONTRACT_NAME, SERVICE_ADDRESS);
    try {
      const data = await client.makeRequest(`${API_URL}/api/premium/weather`);
      logSuccess(`Channel OPEN`);
      log('🔗', `${C.dim}View on Explorer → ${EXPLORER_BASE}?chain=testnet${C.reset}`);
      log('🌤️', `First request: ${data.temperature}°F, ${data.condition}`);
      channelStatus = await checkChannel(agentAddress);
    } catch (e: any) {
      log('⏳', 'Channel opening TX submitted. Waiting for confirmation...');
      log('💡', `${C.dim}On testnet this takes ~5-10 minutes. Re-run after 1 block confirmation.${C.reset}`);
      return;
    }
  }

  await sleep(500);

  // ── Phase 3: Streaming Requests ─────────────────────────────────────────

  console.log('');
  console.log(`${C.bold}${C.white}  ─── STREAMING REQUESTS ──────────────────────────────────────${C.reset}`);
  console.log('');

  log('🚀', `${C.bold}Starting request stream. Zero gas per request.${C.reset}`);
  log('📊', `Initial balance: ${C.green}${microSTXtoSTX(BigInt(channelStatus.remaining))} STX${C.reset}`);
  log('📊', `${balanceBar(channelStatus.remaining, channelStatus.deposit)}`);
  console.log('');

  const endpoints = [
    { path: '/api/premium/weather', label: 'Weather' },
    { path: '/api/premium/market-data', label: 'Markets' },
    { path: '/api/premium/news', label: 'News' },
  ];

  let totalRequests = 0;
  let successfulRequests = 0;
  let hitPaywall = false;
  const deposit = channelStatus.deposit || 1000000;
  let lastKnownBalance = channelStatus.remaining;
  const BALANCE_CHECK_INTERVAL = 10; // check balance every N requests
  const MAX_REQUESTS_FOR_DEMO = 30; // limit for demo video (balance won't deplete in 30s)

  while (!hitPaywall && totalRequests < MAX_REQUESTS_FOR_DEMO) {
    const ep = endpoints[totalRequests % endpoints.length];
    totalRequests++;

    const result = await makeX402Request(`${API_URL}${ep.path}`, agentAddress);

    if (result.ok) {
      successfulRequests++;

      // Check balance periodically
      if (totalRequests % BALANCE_CHECK_INTERVAL === 0) {
        const status = await checkChannel(agentAddress);
        lastKnownBalance = status.remaining;
        const stx = microSTXtoSTX(BigInt(lastKnownBalance));
        const pct = ((lastKnownBalance / deposit) * 100).toFixed(1);

        if (lastKnownBalance < deposit * 0.1) {
          // Critical balance — show every request dramatically
          logWarn(`Request #${totalRequests} → ${C.green}200 OK${C.reset} ${ep.label} | Balance: ${C.red}${stx} STX (${pct}%)${C.reset}`);
          log('📊', `${balanceBar(lastKnownBalance, deposit)}`);
        } else if (lastKnownBalance < deposit * 0.3) {
          logWarn(`Request #${totalRequests} → ${C.green}200 OK${C.reset} ${ep.label} | Balance: ${C.yellow}${stx} STX (${pct}%)${C.reset}`);
          log('📊', `${balanceBar(lastKnownBalance, deposit)}`);
        } else {
          log('📡', `Request #${totalRequests} → ${C.green}200 OK${C.reset} ${ep.label} | Balance: ${stx} STX (${pct}%)`);
          log('📊', `${balanceBar(lastKnownBalance, deposit)}`);
        }
      } else {
        // Compact log for non-check requests
        log('📡', `Request #${totalRequests} → ${C.green}200 OK${C.reset} ${ep.label}`);
      }

      // Small delay between requests for visual effect
      await sleep(150);

    } else if (result.status === 402) {
      // ── THE MONEY SHOT ──
      hitPaywall = true;
      console.log('');
      console.log(`${C.bold}${C.bgRed}${C.white}  ┌─────────────────────────────────────────────────────────┐  ${C.reset}`);
      console.log(`${C.bold}${C.bgRed}${C.white}  │            ❌  402 PAYMENT REQUIRED  ❌                 │  ${C.reset}`);
      console.log(`${C.bold}${C.bgRed}${C.white}  │          SUBSCRIPTION BALANCE DEPLETED                  │  ${C.reset}`);
      console.log(`${C.bold}${C.bgRed}${C.white}  └─────────────────────────────────────────────────────────┘  ${C.reset}`);
      console.log('');

      logError(`Request #${totalRequests} → ${C.red}402 PAYMENT REQUIRED${C.reset}`);
      log('📊', `${balanceBar(0, deposit)}`);
      log('🔒', `${C.red}Subscription expired. Balance mathematically drained to zero.${C.reset}`);
      log('💡', `${C.dim}No oracle. No write transaction. Just block_height × rate_per_block.${C.reset}`);

    } else {
      logError(`Request #${totalRequests} → HTTP ${result.status}`);
      await sleep(1000);
    }
  }

  // If we hit max requests without 402, explain for demo purposes
  if (!hitPaywall && totalRequests >= MAX_REQUESTS_FOR_DEMO) {
    console.log('');
    log('💡', `${C.dim}Demo limit reached (${MAX_REQUESTS_FOR_DEMO} requests). In production, this continues until balance depletes.${C.reset}`);
    log('📊', `Current balance: ${C.green}${microSTXtoSTX(BigInt(lastKnownBalance))} STX${C.reset} ${C.dim}(still active)${C.reset}`);
    log('⏱️', `${C.dim}Balance drains per block, not per request — would last ~${Math.floor((lastKnownBalance / 100) / 30)} days at current rate.${C.reset}`);
  }

  await sleep(800);

  // ── Phase 4: Close Channel ──────────────────────────────────────────────

  console.log('');
  logAction(`${C.bold}Closing channel — settling on-chain...${C.reset}`);
  await sleep(300);

  const closeTxId = await closeChannel(AGENT_PRIVATE_KEY, agentAddress);
  if (closeTxId) {
    logSuccess(`Channel CLOSED — TX: ${C.cyan}${closeTxId}${C.reset}`);
    log('🔗', `${C.dim}${EXPLORER_BASE}/${closeTxId}?chain=testnet${C.reset}`);
  } else {
    log('🔒', `Channel close submitted (or already closed).`);
  }

  await sleep(800);

  // ── Summary ─────────────────────────────────────────────────────────────

  const gasPerTx = 0.001; // rough STX gas cost per write tx
  const savedGas = (successfulRequests - 2) * gasPerTx;
  const savingsPct = successfulRequests > 2 ? ((1 - 2 / successfulRequests) * 100).toFixed(2) : '0';

  console.log('');
  console.log(`${C.bold}${C.white}  ═══════════════════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.bold}${C.white}    SUMMARY${C.reset}`);
  console.log(`${C.bold}${C.white}  ═══════════════════════════════════════════════════════════════${C.reset}`);
  console.log(`${C.bold}    Total requests:     ${C.green}${successfulRequests}${C.reset}`);
  console.log(`${C.bold}    On-chain txns:      ${C.green}2${C.reset} ${C.dim}(open + close)${C.reset}`);
  console.log(`${C.bold}    Gas per request:    ${C.green}0 STX${C.reset} ${C.dim}(read-only verification)${C.reset}`);
  console.log(`${C.bold}    Gas savings:        ${C.green}${savingsPct}%${C.reset} ${C.dim}vs per-request payments${C.reset}`);
  console.log(`${C.bold}    Protocol:           ${C.cyan}x402 v2 compliant${C.reset}`);
  console.log(`${C.bold}    Settlement:         ${C.cyan}Bitcoin-native (Stacks L2)${C.reset}`);
  console.log(`${C.bold}${C.white}  ═══════════════════════════════════════════════════════════════${C.reset}`);
  console.log('');
  console.log(`${C.bold}${C.green}    ${successfulRequests} requests. 2 transactions. ${savingsPct}% gas reduction.${C.reset}`);
  console.log(`${C.bold}${C.green}    Zero human intervention in the payment flow.${C.reset}`);
  console.log(`${C.dim}    This is subscription infrastructure on Bitcoin.${C.reset}`);
  console.log('');
}

runAgentDemo().catch((err) => {
  logError(`Demo failed: ${err.message}`);
  console.error(err);
});
