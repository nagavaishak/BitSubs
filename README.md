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
  'testnet'
);

// Open channel
await client.openChannel(
  serviceAddress,
  1000000n,  // 1 STX
  100n       // 100 microSTX per block
);

// Get channel info
const info = await client.getChannelInfo(subscriberAddress, serviceAddress);
console.log(`Active: ${info.active}, Remaining: ${info.remaining}`);

// Close channel
await client.closeChannel(serviceAddress);
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

- **Blockchain**: Stacks testnet/mainnet
- **Token**: STX (sBTC support roadmap)
- **Smart Contract Language**: Clarity v2
- **Backend**: Node.js + Express + TypeScript
- **Testing**: Vitest + Clarinet
- **Gas Optimization**: Read-only verification (no per-request writes)
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
