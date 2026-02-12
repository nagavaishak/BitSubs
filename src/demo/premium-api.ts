import express from 'express';
import cors from 'cors';
import { x402SubscriptionMiddleware } from '../middleware/x402-subscription';
import { privateKeyToAccount } from 'x402-stacks';
import {
  callReadOnlyFunction,
  principalCV,
  cvToJSON,
} from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

const network = new StacksTestnet();

// ── Configuration ───────────────────────────────────────────────────────────

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || 'ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP';
const CONTRACT_NAME = 'subscription-channel-v2';

// Agent wallets
const AGENT1_KEY = process.env.AGENT1_KEY || '46dc98a045accf5791a17390f0e4ab4c6eb3644535548670dbd4c3a90939a6d7';
const AGENT2_KEY = process.env.AGENT2_KEY || '5ed260e0d654e3dbfeec04b4b46825ab87db6a502fa034f97b15e48bfe40f264';
const AGENT3_KEY = process.env.AGENT3_KEY || 'ef32927f5f847104ad58d380eea27db117efdc044fb6fb3e3f9313bae532f490';

const AGENT1 = privateKeyToAccount(AGENT1_KEY, 'testnet');
const AGENT2 = privateKeyToAccount(AGENT2_KEY, 'testnet');
const AGENT3 = privateKeyToAccount(AGENT3_KEY, 'testnet');

// Service address for existing premium endpoints (wallet demo)
const SERVICE_ADDRESS = process.env.SERVICE_ADDRESS || 'ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP';

// ── Economy Stats (in-memory) ───────────────────────────────────────────────

const economyStats = {
  startedAt: Date.now(),
  agents: {
    weatherOracle: {
      name: 'Weather Oracle',
      role: 'Publishes premium weather data',
      address: AGENT1.address,
      requestsServed: 0,
      channelsServed: 0,
      subscribedTo: null as string | null,
      lastActive: Date.now(),
    },
    tradingAnalyst: {
      name: 'Trading Analyst',
      role: 'Consumes weather → produces trading signals',
      address: AGENT2.address,
      requestsServed: 0,
      requestsMade: 0,
      channelsServed: 0,
      subscribedTo: 'Weather Oracle',
      lastActive: Date.now(),
      lastSignal: null as any,
    },
    portfolioManager: {
      name: 'Portfolio Manager',
      role: 'Consumes signals → makes portfolio decisions',
      address: AGENT3.address,
      requestsServed: 0,
      requestsMade: 0,
      channelsServed: 0,
      subscribedTo: 'Trading Analyst',
      lastActive: Date.now(),
      lastDecision: null as any,
    },
  },
  totalRequests: 0,
  totalTransactions: 0,
};

// ── Helper: check channel balance ───────────────────────────────────────────

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

async function getChannelBalance(subscriber: string, service: string): Promise<{ active: boolean; remaining: number; deposit: number }> {
  try {
    const result = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'verify-payment',
      functionArgs: [principalCV(subscriber), principalCV(service)],
      network,
      senderAddress: subscriber,
    });
    const data = cvToJSON(result);
    const active = findInCV(data, 'active');
    const remaining = findInCV(data, 'remaining');
    const deposit = findInCV(data, 'deposit');
    return {
      active: active?.value === true || active === true,
      remaining: parseInt(String(remaining?.value ?? remaining ?? '0')) || 0,
      deposit: parseInt(String(deposit?.value ?? deposit ?? '0')) || 0,
    };
  } catch {
    return { active: false, remaining: 0, deposit: 0 };
  }
}

// ── Agent 1: Weather Oracle ─────────────────────────────────────────────────
// Existing premium endpoints (also used by wallet demo)

app.use('/api/premium/*', x402SubscriptionMiddleware({
  contractAddress: CONTRACT_ADDRESS,
  contractName: CONTRACT_NAME,
  network: 'testnet',
  serviceAddress: SERVICE_ADDRESS,
}));

app.get('/api/premium/weather', (req, res) => {
  economyStats.agents.weatherOracle.requestsServed++;
  economyStats.agents.weatherOracle.lastActive = Date.now();
  economyStats.totalRequests++;

  res.json({
    location: 'San Francisco',
    temperature: Math.round(55 + Math.random() * 20),
    condition: ['Sunny', 'Partly Cloudy', 'Clear', 'Overcast', 'Foggy'][Math.floor(Math.random() * 5)],
    humidity: Math.round(40 + Math.random() * 40),
    windSpeed: Math.round(5 + Math.random() * 20),
    timestamp: Date.now(),
    source: 'Agent 1: Weather Oracle',
  });
});

app.get('/api/premium/market-data', (req, res) => {
  economyStats.agents.weatherOracle.requestsServed++;
  economyStats.agents.weatherOracle.lastActive = Date.now();
  economyStats.totalRequests++;

  res.json({
    BTC: Math.round(94000 + Math.random() * 3000),
    ETH: Math.round(3400 + Math.random() * 300),
    STX: +(2.5 + Math.random() * 1).toFixed(2),
    timestamp: Date.now(),
    source: 'Agent 1: Weather Oracle',
  });
});

app.get('/api/premium/news', (req, res) => {
  economyStats.agents.weatherOracle.requestsServed++;
  economyStats.agents.weatherOracle.lastActive = Date.now();
  economyStats.totalRequests++;

  res.json({
    headlines: [
      'Bitcoin hits new all-time high',
      'Stacks ecosystem grows 300%',
      'sBTC mainnet launch successful',
    ],
    timestamp: Date.now(),
    source: 'Agent 1: Weather Oracle',
  });
});

// ── Agent 2: Trading Analyst ────────────────────────────────────────────────
// Subscribes to Weather Oracle, produces trading signals

app.use('/api/signals/*', x402SubscriptionMiddleware({
  contractAddress: CONTRACT_ADDRESS,
  contractName: CONTRACT_NAME,
  network: 'testnet',
  serviceAddress: AGENT2.address,
}));

// Stores latest signal produced by Agent 2
let latestSignal: any = {
  action: 'HOLD',
  confidence: 0,
  reasoning: 'Initializing...',
  basedOn: {},
  timestamp: Date.now(),
  source: 'Agent 2: Trading Analyst',
};

app.get('/api/signals/latest', (req, res) => {
  economyStats.agents.tradingAnalyst.requestsServed++;
  economyStats.agents.tradingAnalyst.lastActive = Date.now();
  economyStats.totalRequests++;
  res.json(latestSignal);
});

app.get('/api/signals/history', (req, res) => {
  economyStats.agents.tradingAnalyst.requestsServed++;
  economyStats.agents.tradingAnalyst.lastActive = Date.now();
  economyStats.totalRequests++;
  res.json({ signals: signalHistory.slice(-20), source: 'Agent 2: Trading Analyst' });
});

const signalHistory: any[] = [];

// ── Agent 3: Portfolio Manager ──────────────────────────────────────────────
// Subscribes to Trading Analyst, makes portfolio decisions

app.use('/api/portfolio/*', x402SubscriptionMiddleware({
  contractAddress: CONTRACT_ADDRESS,
  contractName: CONTRACT_NAME,
  network: 'testnet',
  serviceAddress: AGENT3.address,
}));

let latestDecision: any = {
  portfolio: { BTC: 60, ETH: 25, STX: 10, CASH: 5 },
  action: 'REBALANCE',
  reasoning: 'Initializing...',
  basedOn: {},
  timestamp: Date.now(),
  source: 'Agent 3: Portfolio Manager',
};

const decisionHistory: any[] = [];

app.get('/api/portfolio/latest', (req, res) => {
  economyStats.agents.portfolioManager.requestsServed++;
  economyStats.agents.portfolioManager.lastActive = Date.now();
  economyStats.totalRequests++;
  res.json(latestDecision);
});

app.get('/api/portfolio/history', (req, res) => {
  economyStats.agents.portfolioManager.requestsServed++;
  economyStats.agents.portfolioManager.lastActive = Date.now();
  economyStats.totalRequests++;
  res.json({ decisions: decisionHistory.slice(-20), source: 'Agent 3: Portfolio Manager' });
});

// ── Stats Endpoint ──────────────────────────────────────────────────────────

app.get('/api/stats', async (req, res) => {
  // Fetch live channel balances
  const [ch_2to1, ch_3to2] = await Promise.all([
    getChannelBalance(AGENT2.address, SERVICE_ADDRESS),
    getChannelBalance(AGENT3.address, AGENT2.address),
  ]);

  const totalRequests = economyStats.totalRequests;
  // Each active channel = 1 open-channel tx on-chain
  const totalTx = (ch_2to1.active ? 1 : 0) + (ch_3to2.active ? 1 : 0);
  const gasReduction = totalRequests > 2
    ? ((1 - totalTx / totalRequests) * 100).toFixed(2) + '%'
    : '0%';

  res.json({
    uptime: Date.now() - economyStats.startedAt,
    totalRequests,
    totalTransactions: totalTx,
    gasReduction,
    agents: [
      {
        name: 'Weather Oracle',
        role: economyStats.agents.weatherOracle.role,
        address: AGENT1.address,
        requestsServed: economyStats.agents.weatherOracle.requestsServed,
        subscribedTo: null,
        channel: null,
      },
      {
        name: 'Trading Analyst',
        role: economyStats.agents.tradingAnalyst.role,
        address: AGENT2.address,
        requestsServed: economyStats.agents.tradingAnalyst.requestsServed,
        requestsMade: economyStats.agents.tradingAnalyst.requestsMade,
        subscribedTo: 'Weather Oracle',
        channel: {
          subscriber: AGENT2.address,
          service: SERVICE_ADDRESS,
          active: ch_2to1.active,
          remaining: ch_2to1.remaining,
          deposit: ch_2to1.deposit,
        },
        lastSignal: economyStats.agents.tradingAnalyst.lastSignal,
      },
      {
        name: 'Portfolio Manager',
        role: economyStats.agents.portfolioManager.role,
        address: AGENT3.address,
        requestsServed: economyStats.agents.portfolioManager.requestsServed,
        requestsMade: economyStats.agents.portfolioManager.requestsMade,
        subscribedTo: 'Trading Analyst',
        channel: {
          subscriber: AGENT3.address,
          service: AGENT2.address,
          active: ch_3to2.active,
          remaining: ch_3to2.remaining,
          deposit: ch_3to2.deposit,
        },
        lastDecision: economyStats.agents.portfolioManager.lastDecision,
      },
    ],
    contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
  });
});

// ── Public Endpoints ────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'BitSubs x402 subscription service running',
    economy: 'active',
    agents: 3,
    contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
  });
});

app.get('/info', (req, res) => {
  res.json({
    name: 'BitSubs Premium API',
    version: '2.0.0',
    description: 'Bitcoin subscriptions via x402 on Stacks — Multi-Agent Economy',
    endpoints: {
      weatherOracle: ['/api/premium/weather', '/api/premium/market-data', '/api/premium/news'],
      tradingAnalyst: ['/api/signals/latest', '/api/signals/history'],
      portfolioManager: ['/api/portfolio/latest', '/api/portfolio/history'],
      economy: ['/api/stats'],
      public: ['/health', '/info'],
    },
    instructions: 'Endpoints are protected by x402 protocol. Payment is handled automatically via payment-signature header.',
  });
});

// Demo signing endpoint (for interactive demo)
app.post('/api/demo/sign', (req, res) => {
  try {
    const { resource } = req.body;
    if (!resource) return res.status(400).json({ error: 'resource required' });

    const DEMO_ADDRESS = process.env.DEMO_WALLET_ADDRESS || 'ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP';
    const message = JSON.stringify({ domain: 'x402-subscription', resource, purpose: 'subscription-access' });
    const signature = Buffer.from(message).toString('base64');
    res.json({ signature, address: DEMO_ADDRESS });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Agent Background Loops ──────────────────────────────────────────────────

const API_BASE = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;

function makeProof(address: string, resource: string): { 'x-payment-proof': string; 'x-stacks-address': string } {
  return {
    'x-payment-proof': Buffer.from(`${address}:${resource}`).toString('base64'),
    'x-stacks-address': address,
  };
}

// Agent 2 loop: consume weather → produce signal
async function agent2Loop() {
  try {
    const res = await fetch(`${API_BASE}/api/premium/weather`, {
      headers: makeProof(AGENT2.address, '/api/premium/weather'),
    });

    if (res.status === 200) {
      const weather: any = await res.json();
      economyStats.agents.tradingAnalyst.requestsMade++;
      economyStats.agents.tradingAnalyst.lastActive = Date.now();

      // Generate trading signal based on weather
      const temp = weather.temperature || 60;
      const action = temp > 70 ? 'BUY' : temp < 55 ? 'SELL' : 'HOLD';
      const confidence = Math.round(60 + Math.random() * 35);

      latestSignal = {
        action,
        confidence,
        reasoning: `Temperature ${temp}°F in ${weather.location}. ${weather.condition}. ${action === 'BUY' ? 'Warm weather correlates with market optimism.' : action === 'SELL' ? 'Cold snap suggests risk-off sentiment.' : 'Neutral conditions, maintain positions.'}`,
        basedOn: { weather: { temp: weather.temperature, condition: weather.condition } },
        timestamp: Date.now(),
        source: 'Agent 2: Trading Analyst',
      };

      economyStats.agents.tradingAnalyst.lastSignal = latestSignal;
      signalHistory.push(latestSignal);
      if (signalHistory.length > 100) signalHistory.shift();

      console.log(`[Agent 2] Consumed weather → Signal: ${action} (${confidence}% confidence)`);
    } else if (res.status === 402) {
      console.log(`[Agent 2] 402 — Channel needs funding. Subscription to Weather Oracle inactive.`);
    }
  } catch (err: any) {
    console.log(`[Agent 2] Error: ${err.message}`);
  }
}

// Agent 3 loop: consume signal → produce portfolio decision
async function agent3Loop() {
  try {
    const res = await fetch(`${API_BASE}/api/signals/latest`, {
      headers: makeProof(AGENT3.address, '/api/signals/latest'),
    });

    if (res.status === 200) {
      const signal: any = await res.json();
      economyStats.agents.portfolioManager.requestsMade++;
      economyStats.agents.portfolioManager.lastActive = Date.now();

      // Make portfolio decision based on signal
      let portfolio = { BTC: 60, ETH: 25, STX: 10, CASH: 5 };
      let action = 'HOLD';

      if (signal.action === 'BUY' && signal.confidence > 70) {
        portfolio = { BTC: 70, ETH: 20, STX: 8, CASH: 2 };
        action = 'INCREASE_EXPOSURE';
      } else if (signal.action === 'SELL' && signal.confidence > 70) {
        portfolio = { BTC: 40, ETH: 15, STX: 5, CASH: 40 };
        action = 'REDUCE_EXPOSURE';
      } else {
        portfolio = { BTC: 55, ETH: 25, STX: 12, CASH: 8 };
        action = 'REBALANCE';
      }

      latestDecision = {
        portfolio,
        action,
        reasoning: `Signal: ${signal.action} @ ${signal.confidence}% confidence. ${action === 'INCREASE_EXPOSURE' ? 'Strong buy signal, increasing crypto allocation.' : action === 'REDUCE_EXPOSURE' ? 'Strong sell signal, moving to cash.' : 'Mixed signals, rebalancing to neutral.'}`,
        basedOn: { signal: { action: signal.action, confidence: signal.confidence } },
        timestamp: Date.now(),
        source: 'Agent 3: Portfolio Manager',
      };

      economyStats.agents.portfolioManager.lastDecision = latestDecision;
      decisionHistory.push(latestDecision);
      if (decisionHistory.length > 100) decisionHistory.shift();

      console.log(`[Agent 3] Consumed signal → Decision: ${action} (BTC: ${portfolio.BTC}%)`);
    } else if (res.status === 402) {
      console.log(`[Agent 3] 402 — Channel needs funding. Subscription to Trading Analyst inactive.`);
    }
  } catch (err: any) {
    console.log(`[Agent 3] Error: ${err.message}`);
  }
}

// ── Start Server & Agent Loops ──────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  BitSubs Multi-Agent Economy v2.0');
  console.log('  Protocol: x402 v2 on Stacks | Settlement: Bitcoin');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  Server:    http://localhost:${PORT}`);
  console.log(`  Contract:  ${CONTRACT_ADDRESS}.${CONTRACT_NAME}`);
  console.log('');
  console.log('  Agents:');
  console.log(`    1. Weather Oracle    ${AGENT1.address}`);
  console.log(`    2. Trading Analyst   ${AGENT2.address}`);
  console.log(`    3. Portfolio Manager ${AGENT3.address}`);
  console.log('');
  console.log('  Economy endpoints:');
  console.log(`    /api/premium/*    → Agent 1 (weather, market, news)`);
  console.log(`    /api/signals/*    → Agent 2 (trading signals)`);
  console.log(`    /api/portfolio/*  → Agent 3 (portfolio decisions)`);
  console.log(`    /api/stats        → Live economy stats`);
  console.log('');
  console.log('  Agent loops starting in 5s...');
  console.log('═══════════════════════════════════════════════════════════════');

  // Start agent loops after a short delay
  setTimeout(() => {
    console.log('[Economy] Agent loops started. Agents run every 30s.');

    // Agent 2 runs every 30 seconds
    agent2Loop();
    setInterval(agent2Loop, 30_000);

    // Agent 3 runs every 45 seconds (slightly offset)
    setTimeout(() => {
      agent3Loop();
      setInterval(agent3Loop, 45_000);
    }, 10_000);
  }, 5_000);
});
