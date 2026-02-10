# BitSubs: Bitcoin Subscriptions via x402

**The first way to run continuous subscriptions on Bitcoin.**

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)]() [![Clarity](https://img.shields.io/badge/clarity-v2-blue)]() [![TypeScript](https://img.shields.io/badge/typescript-5.3-blue)]()

## What This Is

BitSubs enables continuous subscription access using payment channels on Stacks. Services stay open while STX micropayments stream, and automatically cut off when the channel balance depletes.

**Key Innovation**: 1000 subscription requests = 2 on-chain transactions (99.8% gas reduction)

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

**Response (402):**
```json
{
  "error": "Payment Required",
  "x402": {
    "version": 1,
    "paymentInstructions": {
      "network": "stacks-testnet",
      "chainId": "stacks:testnet",
      "tokens": [{
        "token": "STX",
        "amount": "1000000",
        "recipient": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        "contractCall": {
          "contractAddress": "ST...",
          "contractName": "subscription-channel",
          "functionName": "open-channel",
          "functionArgs": ["principal:...", "uint:1000000", "uint:100"]
        }
      }],
      "description": "Open subscription channel for continuous API access",
      "resource": "/api/premium/data"
    }
  }
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
git clone https://github.com/yourusername/bitsubs
cd bitsubs

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

### Run the Demo API

```bash
# Set environment variables
export CONTRACT_ADDRESS="YOUR_DEPLOYED_CONTRACT_ADDRESS"
export SERVICE_ADDRESS="YOUR_SERVICE_WALLET_ADDRESS"

# Start the premium API server
npm run server
```

### Run the Agent Demo

```bash
# Set environment variables
export PRIVATE_KEY="YOUR_TESTNET_PRIVATE_KEY"
export CONTRACT_ADDRESS="YOUR_DEPLOYED_CONTRACT_ADDRESS"
export SERVICE_ADDRESS="YOUR_SERVICE_WALLET_ADDRESS"

# Run the demo
npm run demo
```

## Project Structure

```
bitsubs/
├── bitsubs/                          # Clarinet project
│   ├── contracts/
│   │   └── subscription-channel.clar # Core Clarity contract
│   ├── tests/
│   │   └── subscription-channel.test.ts
│   └── Clarinet.toml
├── src/
│   ├── middleware/
│   │   └── x402-subscription.ts      # Express middleware
│   ├── client/
│   │   └── subscription-client.ts    # TypeScript SDK
│   └── demo/
│       ├── premium-api.ts            # Protected service demo
│       └── agent.ts                  # Terminal agent demo
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

```typescript
import { x402SubscriptionMiddleware } from './src/middleware/x402-subscription';

app.use('/api/premium/*', x402SubscriptionMiddleware({
  contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  contractName: 'subscription-channel',
  network: 'testnet',
  serviceAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
}));

app.get('/api/premium/data', (req, res) => {
  res.json({ message: 'Protected data' });
});
```

## Use Cases

### SaaS on Bitcoin
Monthly/annual subscriptions for web services without recurring credit card charges.

### AI Agent Subscriptions
Autonomous agents paying per-block for API access without manual intervention.

### Streaming Content Monetization
Pay-per-second video streaming with automatic cutoff when balance depletes.

### Premium Data Feeds
Real-time market data access that automatically gates when subscription expires.

### IoT Device Access
Smart devices paying for network/API access proportional to usage time.

## Technical Details

- **Protocol**: x402 payment protocol for Stacks
- **Blockchain**: Stacks testnet/mainnet
- **Token**: STX (sBTC support roadmap)
- **Smart Contract Language**: Clarity v2
- **Backend**: Node.js + Express + TypeScript
- **Testing**: Vitest + Clarinet
- **Gas Optimization**: Read-only verification (no per-request writes)
- **x402 Compliance**: Full schema compliance with payment channel verification
- **Deployed Contract**: `STDJM59BQ5320FM808QWEVP4JXH0R9BYS4Q0YE6C.subscription-channel` (testnet)
- **Explorer**: https://explorer.hiro.so/txid/6dcf04602d18d9208c44bb5b83052af232089e469cf0b116d67fd77e744a2743?chain=testnet

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

- [ ] sBTC support for Bitcoin-native subscriptions
- [ ] Multi-token support (USDC, USDCx)
- [ ] Dashboard UI for channel management
- [ ] Batch channel operations
- [ ] Subscription marketplace

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

## Contact

- GitHub: [@yourusername](https://github.com/yourusername)
- Twitter: [@yourhandle](https://twitter.com/yourhandle)
- Discord: your#discord

---

**Built with ❤️ for the Stacks ecosystem**
