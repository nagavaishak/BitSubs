import express from 'express';
import cors from 'cors';
import { x402SubscriptionMiddleware } from '../middleware/x402-subscription';

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' })); // CRITICAL - demo page needs this

// Configuration (Deployed to Testnet)
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || 'ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP';
const CONTRACT_NAME = 'subscription-channel-v2';
const SERVICE_ADDRESS = process.env.SERVICE_ADDRESS || 'ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP';

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
    instructions: 'Endpoints are protected by x402 protocol. Payment is handled automatically via payment-signature header.'
  });
});

// Demo signing endpoint (for interactive demo)
app.post('/api/demo/sign', (req, res) => {
  try {
    const { resource } = req.body;

    if (!resource) {
      return res.status(400).json({ error: 'resource required' });
    }

    // Demo wallet address (pre-configured with open channel)
    const DEMO_ADDRESS = process.env.DEMO_WALLET_ADDRESS || 'ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP';

    const message = JSON.stringify({
      domain: 'x402-subscription',
      resource,
      purpose: 'subscription-access'
    });

    // Simple signature for demo (base64 encoded message)
    const signature = Buffer.from(message).toString('base64');

    res.json({ signature, address: DEMO_ADDRESS });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 BitSubs Premium API running on http://localhost:${PORT}`);
  console.log(`📡 Premium endpoints require active STX subscription`);
  console.log(`📝 Contract: ${CONTRACT_ADDRESS}.${CONTRACT_NAME}`);
  console.log(`💡 Test with: curl http://localhost:${PORT}/health`);
});
