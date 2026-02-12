# BitSubs: Bitcoin Subscriptions via x402

**The first way to run continuous subscriptions on Bitcoin.**

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)]() [![Clarity](https://img.shields.io/badge/clarity-v2-blue)]() [![TypeScript](https://img.shields.io/badge/typescript-5.3-blue)]() [![License](https://img.shields.io/badge/license-MIT-blue)]() [![x402](https://img.shields.io/badge/x402-compliant-orange)](https://x402.org)

**🌐 [Live Demo](https://bitsubs.vercel.app)** | **🚀 [Live API](https://bitsubs-production.up.railway.app/health)** | **📝 [Contract Explorer](https://explorer.hiro.so/txid/49ad441c47246c6e95ce332fce14bab0fc5927da2113410b58478aae0fa187ac?chain=testnet)**

## What This Is

BitSubs enables continuous subscription access using payment channels on Stacks. Services stay open while STX micropayments stream, and automatically cut off when the channel balance depletes.

**Key Innovation**: 1000 subscription requests = 2 on-chain transactions (99.8% gas reduction)

**New**: Multi-agent economy where 3 AI agents autonomously pay each other through subscription channels — live on the [/economy dashboard](https://bitsubs.vercel.app)

## Try It Now

**Test the live x402 API:**

```bash
curl https://bitsubs-production.up.railway.app/api/premium/weather
```

Returns a 402 Payment Required response with x402 v2 payment instructions:
```json
{
  "error": "Payment Required",
  "x402Version": 2,
  "accepts": [{
    "scheme": "subscription-channel",
    "network": "bip122:000000000019d6689c085ae165831e93/slip44:5757",
    "token": "STX",
    "amount": "1000000",
    "contractCall": {
      "contractAddress": "ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP",
      "contractName": "subscription-channel-v2",
      "functionName": "open-channel",
      "functionArgs": ["principal:ST4F...", "uint:1000000", "uint:100"]
    }
  }]
}
```

**Interactive Demos:**
- [Quick Demo](https://bitsubs.vercel.app) - Simulated subscription flow
- [Real Wallet Demo](https://bitsubs.vercel.app) - Connect Hiro/Leather wallet
- [Multi-Agent Economy](https://bitsubs.vercel.app) - 3 AI agents paying each other live

## How It Works

1. **Subscriber opens a payment channel** with a deposit
2. **Balance drains mathematically** based on elapsed blocks
3. **Service checks balance** via read-only Clarity function
4. **Access granted if** `remaining = deposit - (elapsed_blocks × rate) > 0`
5. **Access revoked automatically** when balance hits zero
6. **Channel closes** with final settlement

## x402 Protocol Compliance

BitSubs implements the x402 payment protocol for Stacks, enabling standardized payment-required responses with on-chain payment channel verification.

### x402 Flow

1. **Client requests protected endpoint** without payment proof
2. **Server returns 402** with x402 payment instructions schema
3. **Client opens channel** via Clarity contract (following x402 instructions)
4. **Client signs payment proof** and retries request
5. **Server verifies** signature and channel state on-chain
6. **Server grants access** (200 OK) if channel is active

### x402 Headers

**Request Headers:**
- `x-payment-proof`: Payment proof (base64-encoded proof of channel ownership)
- `x-stacks-address`: Stacks address making the request

**Response (402) - x402 v2 format:**
```json
{
  "error": "Payment Required",
  "x402Version": 2,
  "accepts": [
    {
      "scheme": "subscription-channel",
      "network": "bip122:000000000019d6689c085ae165831e93/slip44:5757",
      "token": "STX",
      "amount": "1000000",
      "payTo": "ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP",
      "contractCall": {
        "contractAddress": "ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP",
        "contractName": "subscription-channel-v2",
        "functionName": "open-channel",
        "functionArgs": [
          "principal:ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP",
          "uint:1000000",
          "uint:100"
        ]
      }
    },
    {
      "scheme": "subscription-channel",
      "network": "bip122:000000000019d6689c085ae165831e93/slip44:5757",
      "token": "sBTC",
      "amount": "10000",
      "payTo": "ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP",
      "contractCall": {
        "contractAddress": "ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP",
        "contractName": "subscription-channel-v2",
        "functionName": "open-channel-sbtc",
        "functionArgs": [
          "principal:ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP",
          "uint:10000",
          "uint:1"
        ]
      }
    }
  ]
}
```

### Server Verification

The server verifies each request by:
1. **Validating payment proof** against provided Stacks address
2. **Checking channel state** via Clarity read-only function `verify-payment`
3. **Granting access** only if channel is active and balance > 0

### Why x402 + Payment Channels?

**Traditional x402**: 1000 requests = 1000 on-chain payment transactions
**BitSubs**: 1000 requests = 2 on-chain transactions (99.8% gas reduction)

This is the **first x402 implementation for continuous subscriptions** - combining the standardized x402 protocol with payment channels to enable Bitcoin-native subscriptions at scale.

## Architecture

```
┌─────────────┐                           ┌──────────────┐
│  Subscriber │                           │   Service    │
│             │                           │   Provider   │
└──────┬──────┘                           └──────┬───────┘
       │                                         │
       │  1. Open Channel (STX deposit)         │
       │────────────────────────────────────────>│
       │                                         │
       │  2. Request Access + Subscriber ID     │
       │────────────────────────────────────────>│
       │                                         │
       │                    3. Verify Payment ──┤
       │                       (READ-ONLY)       │
       │                       ↓                 │
       │              ┌──────────────────┐      │
       │              │ Clarity Contract │      │
       │              │  verify-payment  │      │
       │              └──────────────────┘      │
       │                       ↓                 │
       │                 remaining > 0?          │
       │                                         │
       │  <───── 4. Access Granted/Denied ──────│
       │                                         │
       │  ... (1000 more requests) ...          │
       │                                         │
       │  5. Close Channel & Settle             │
       │────────────────────────────────────────>│
       │                                         │
```

**Read-Only Verification Model**:
- No per-request write transactions
- Balance calculated: `remaining = deposit - ((block-height - opened-at) × rate)`
- Middleware queries contract state, never modifies it
- TRUE "1000 payments = 2 on-chain transactions"

## Quick Start

### Prerequisites

- Node.js >= 18
- Clarinet >= 3.0
- Stacks testnet account with STX

### Installation

```bash
# Clone repository
git clone https://github.com/nagavaishak/BitSubs
cd BitSubs

# Install dependencies
npm install

# Run Clarity tests
cd bitsubs && npm test

# Compile TypeScript
cd .. && npm run build
```

### Deploy Contract to Testnet

```bash
cd bitsubs
clarinet integrate
clarinet deployments apply -p testnet
```

### Run the Demo API Server

```bash
# Start the premium API server (multi-agent economy)
npm run server

# Or for development
npm run dev
```

The server includes:
- `/api/premium/*` - Weather Oracle endpoints (Agent 1)
- `/api/signals/*` - Trading Analyst endpoints (Agent 2)
- `/api/portfolio/*` - Portfolio Manager endpoints (Agent 3)
- `/api/stats` - Live economy stats (for /economy dashboard)

### Run the Agent Demo

```bash
# Cinematic terminal demo
npm run demo

# Or watch an agent stream requests until 402 cutoff
npm run agent-demo
```

### Open Economy Channels (for multi-agent demo)

```bash
# Fund Agent 2 and Agent 3 from testnet faucet, then:
npm run open-channels
```

This opens 2 subscription channels on-chain so the economy agents can pay each other.

## Project Structure

```
BitSubs/
├── bitsubs/                          # Clarinet project
│   ├── contracts/
│   │   └── subscription-channel-v2.clar # Core Clarity contract
│   ├── tests/
│   │   └── subscription-channel-v2.test.ts
│   └── Clarinet.toml
├── src/
│   ├── middleware/
│   │   └── x402-subscription.ts      # x402 v2 Express middleware
│   ├── client/
│   │   └── subscription-client.ts    # TypeScript SDK
│   └── demo/
│       ├── premium-api.ts            # Multi-agent economy server
│       ├── agent.ts                  # Cinematic terminal demo
│       └── open-economy-channels.ts  # Channel opener script
├── dashboard/                        # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Economy.tsx           # Live multi-agent dashboard
│   │   │   ├── RealWalletDemo.tsx    # Hiro/Leather integration
│   │   │   └── ...
│   │   └── App.css
│   └── package.json
├── README.md
├── package.json
└── tsconfig.json
```

## API Reference

### Clarity Contract Functions

#### `open-channel`

Opens a new subscription channel.

```clarity
(open-channel (service principal) (deposit uint) (rate-per-block uint))
```

**Parameters:**
- `service`: Service provider's Stacks address
- `deposit`: Initial deposit amount in microSTX
- `rate-per-block`: Payment rate in microSTX per block

**Returns:** `(ok bool)` on success

#### `verify-payment` (READ-ONLY)

Verifies if a subscription is active.

```clarity
(verify-payment (subscriber principal) (service principal))
```

**Returns:**
```clarity
{
  active: bool,
  remaining: uint,
  deposit: uint,
  rate: uint,
  opened-at: uint
}
```

#### `close-channel`

Closes a channel and settles balances.

```clarity
(close-channel (service principal))
```

**Returns:**
```clarity
{
  consumed: uint,
  refunded: uint
}
```

#### `force-close-channel`

Force closes a channel after timeout (10 blocks on testnet, 1008 on mainnet).

```clarity
(force-close-channel (subscriber principal) (service principal))
```

### TypeScript SDK

```typescript
import { BitSubsClient } from './src/client/subscription-client';

const client = new BitSubsClient(
  privateKey,
  contractAddress,
  contractName,
  serviceAddress  // Service provider address
);

// x402-compliant request flow
// Client automatically:
// 1. Gets 402 response with x402 instructions
// 2. Opens channel if needed
// 3. Creates payment proof
// 4. Retries with proof headers
const data = await client.makeRequest('http://localhost:3000/api/premium/data');
console.log(data); // Protected resource data

// That's it! The SDK handles the entire x402 flow automatically
```

**Manual Channel Operations** (if needed):
```typescript
// Check existing channel
const hasChannel = await client.checkExistingChannel();

// Get client address
const address = client.getAddress();
```

### Express Middleware

Protect your API endpoints with 3 lines of code:

```typescript
import { x402SubscriptionMiddleware } from '@bitsubs/middleware';

app.use('/api/premium/*', x402SubscriptionMiddleware({
  contractAddress: 'ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP',
  contractName: 'subscription-channel-v2',
  network: 'testnet',
  serviceAddress: 'YOUR_SERVICE_ADDRESS'
}));

app.get('/api/premium/data', (req, res) => {
  res.json({ message: 'Protected data' });
});
```

The middleware automatically:
1. Returns 402 Payment Required with x402 v2 schema for unpaid requests
2. Verifies payment proof via on-chain `verify-payment` call
3. Grants access if channel balance > 0

## Use Cases

### Multi-Agent AI Economies
Autonomous AI agents paying each other for data/services through subscription channels. **See it live:** [/economy dashboard](https://bitsubs.vercel.app) — 3 agents (Weather Oracle, Trading Analyst, Portfolio Manager) paying each other in real-time.

### SaaS on Bitcoin
Monthly/annual subscriptions for web services without recurring credit card charges.

### AI Agent API Access
Autonomous agents paying per-block for API access without manual intervention. No human in the loop, pure agent-to-service subscriptions.

### Streaming Content Monetization
Pay-per-second video streaming with automatic cutoff when balance depletes.

### Premium Data Feeds
Real-time market data access that automatically gates when subscription expires.

### IoT Device Access
Smart devices paying for network/API access proportional to usage time.

## Live Deployments

### Production Infrastructure
- **Dashboard**: https://bitsubs.vercel.app (Vercel)
- **API**: https://bitsubs-production.up.railway.app (Railway)
- **Contract**: `ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP.subscription-channel-v2` (Stacks Testnet)
- **Explorer**: [View on Stacks Explorer](https://explorer.hiro.so/txid/49ad441c47246c6e95ce332fce14bab0fc5927da2113410b58478aae0fa187ac?chain=testnet)

### API Endpoints

**Public:**
- `GET /health` - Health check
- `GET /info` - Service info

**Protected (Weather Oracle - Agent 1):**
- `GET /api/premium/weather` - Requires subscription channel
- `GET /api/premium/market-data` - Requires subscription channel
- `GET /api/premium/news` - Requires subscription channel

**Protected (Trading Analyst - Agent 2):**
- `GET /api/signals/latest` - Requires subscription channel
- `GET /api/signals/history` - Requires subscription channel

**Protected (Portfolio Manager - Agent 3):**
- `GET /api/portfolio/latest` - Requires subscription channel
- `GET /api/portfolio/history` - Requires subscription channel

**Economy Stats:**
- `GET /api/stats` - Live multi-agent economy data (public)

## Technical Details

- **Protocol**: x402 v2 payment protocol for Stacks
- **x402 Package**: Integrated with `x402-stacks` npm package for protocol-layer utilities
- **Blockchain**: Stacks testnet (Bitcoin L2)
- **Token**: STX (sBTC support in contract, pending testnet stability)
- **Smart Contract Language**: Clarity v2
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + Framer Motion
- **Testing**: Vitest + Clarinet (13/13 tests passing)
- **Gas Optimization**: Read-only verification (no per-request writes)
- **x402 Compliance**: Full v2 schema compliance with subscription channel verification
- **Deployed Contract**: `ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP.subscription-channel-v2` (testnet)
- **Explorer**: https://explorer.hiro.so/txid/49ad441c47246c6e95ce332fce14bab0fc5927da2113410b58478aae0fa187ac?chain=testnet
- **Live Infrastructure**: Vercel (dashboard) + Railway (API)

## Testing

```bash
# Run Clarity contract tests
cd bitsubs && npm test

# Expected output: 13/13 tests passing
```

### Test Coverage

- ✅ Channel opening and duplicate prevention
- ✅ Mathematical balance drain verification
- ✅ Underflow protection
- ✅ Channel closing and settlement
- ✅ Force-close timeout enforcement
- ✅ Edge cases (zero rate, immediate close, etc.)

## Benchmarks

| Metric | Value |
|--------|-------|
| On-chain tx per 1000 requests | 2 |
| Gas reduction | 99.8% |
| Verification latency | < 100ms |
| Contract size | < 5 KB |

## Security Considerations

1. **Underflow Protection**: Contract prevents integer underflow when consumed > deposit
2. **Force-Close Timeout**: Subscribers can recover funds if service is unresponsive (10 blocks testnet, 7 days mainnet)
3. **Read-Only Verification**: No state manipulation during access checks
4. **Principal Authentication**: Only channel participants can close channels

## Roadmap

- [x] x402 v2 protocol compliance ✅
- [x] Multi-agent economy demonstration ✅ [Live](https://bitsubs.vercel.app)
- [x] Dashboard UI for channel management ✅ [Live](https://bitsubs.vercel.app)
- [x] Real wallet integration (Hiro/Leather) ✅
- [ ] sBTC support (contract ready, pending testnet stability)
- [ ] Multi-token support (USDC, USDCx)
- [ ] Batch channel operations
- [ ] Subscription marketplace
- [ ] Mainnet deployment

## Contributing

Contributions welcome! Please open an issue or PR.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

Built for the x402 Stacks Challenge (Feb 9-16, 2026)

Inspired by:
- Superfluid Finance (streaming payments)
- Cheddr (payment channels)
- Lightning Network (Bitcoin L2 channels)

## Links

- **Live Dashboard**: https://bitsubs.vercel.app
- **Live API**: https://bitsubs-production.up.railway.app
- **GitHub**: https://github.com/nagavaishak/BitSubs
- **Contract Explorer**: https://explorer.hiro.so/txid/49ad441c47246c6e95ce332fce14bab0fc5927da2113410b58478aae0fa187ac?chain=testnet
- **x402 Protocol**: https://x402.org

---

**Built with ❤️ for the Stacks ecosystem**
