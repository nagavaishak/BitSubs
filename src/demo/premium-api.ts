import express from 'express';
import { x402SubscriptionMiddleware } from '../middleware/x402-subscription';

const app = express();
app.use(express.json());

// Configuration (replace with your deployed contract)
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const CONTRACT_NAME = 'subscription-channel';
const SERVICE_ADDRESS = process.env.SERVICE_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

// Apply middleware to premium endpoints
app.use('/api/premium/*', x402SubscriptionMiddleware({
  contractAddress: CONTRACT_ADDRESS,
  contractName: CONTRACT_NAME,
  network: 'testnet',
  serviceAddress: SERVICE_ADDRESS
}));

// Premium endpoints (protected by x402)
app.get('/api/premium/weather', (req, res) => {
  res.json({
    location: 'San Francisco',
    temperature: 62,
    condition: 'Partly Cloudy',
    timestamp: Date.now(),
    message: '✅ Paid via STX subscription channel'
  });
});

app.get('/api/premium/market-data', (req, res) => {
  res.json({
    BTC: 95420,
    ETH: 3540,
    STX: 2.87,
    timestamp: Date.now(),
    message: '✅ Paid via STX subscription channel'
  });
});

app.get('/api/premium/news', (req, res) => {
  res.json({
    headlines: [
      'Bitcoin hits new all-time high',
      'Stacks ecosystem grows 300%',
      'sBTC mainnet launch successful'
    ],
    timestamp: Date.now(),
    message: '✅ Paid via STX subscription channel'
  });
});

// Public health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'BitSubs x402 subscription service running',
    contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`
  });
});

// Public info endpoint
app.get('/info', (req, res) => {
  res.json({
    name: 'BitSubs Premium API',
    version: '1.0.0',
    description: 'Bitcoin subscriptions via x402 on Stacks',
    endpoints: {
      premium: [
        '/api/premium/weather',
        '/api/premium/market-data',
        '/api/premium/news'
      ],
      public: [
        '/health',
        '/info'
      ]
    },
    instructions: 'Include x-subscriber-id header to access premium endpoints'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 BitSubs Premium API running on http://localhost:${PORT}`);
  console.log(`📡 Premium endpoints require active STX subscription`);
  console.log(`📝 Contract: ${CONTRACT_ADDRESS}.${CONTRACT_NAME}`);
  console.log(`💡 Test with: curl http://localhost:${PORT}/health`);
});
