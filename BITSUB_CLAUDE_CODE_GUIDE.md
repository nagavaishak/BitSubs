# BitSub: Claude Code Implementation Guide
**x402 Stacks Challenge - Feb 9-16, 2026**

---

## QUICK CONTEXT (Read This First)

**What We're Building**: Bitcoin subscription infrastructure using x402 protocol on Stacks blockchain.

**One-Sentence Pitch**: "The first way to run continuous subscriptions on Bitcoin - using x402 to stream STX payments and automatically gate access when payments stop."

**Why This Wins**: 
- Combines two proven x402 winners (Superfluid subscriptions + Cheddr channels)
- Infrastructure layer (Stacks judges reward this 3:1 over apps)
- Novel mechanism (subscriptions don't exist on Bitcoin)
- Perfect timing (Fireblocks + sBTC institutional moment)

**Critical Architecture Decision**: 
- ✅ Verification is READ-ONLY (no per-request writes)
- ✅ Balance drains mathematically: `remaining = deposit - (elapsed_blocks × rate)`
- ✅ TRUE "1000 payments = 2 on-chain transactions" (open + close only)

---

## PROJECT STRUCTURE

```
bitsub/
├── contracts/
│   ├── subscription-channel.clar      # Core Clarity contract
│   ├── Clarinet.toml                  
│   └── tests/
│       └── subscription-channel_test.ts
├── src/
│   ├── middleware/
│   │   └── x402-subscription.ts       # Express middleware
│   ├── client/
│   │   └── subscription-client.ts     # SDK
│   └── demo/
│       ├── premium-api.ts             # Protected service
│       └── agent.ts                   # Terminal agent demo
├── README.md
├── package.json
└── tsconfig.json
```

---

## DAY 1: CLARITY CONTRACT FOUNDATION

### Step 1: Initialize Clarinet Project

```bash
# Install Clarinet if needed
clarinet --version

# Create project
clarinet new bitsub
cd bitsub

# Initialize contract
clarinet contract new subscription-channel
```

### Step 2: Implement Core Data Structures

**File**: `contracts/subscription-channel.clar`

```clarity
;; subscription-channel.clar
;; Bitcoin subscriptions via x402 on Stacks

;; Error codes
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-UNAUTHORIZED (err u403))
(define-constant ERR-INSUFFICIENT-BALANCE (err u402))
(define-constant ERR-CHANNEL-EXISTS (err u409))

;; Channel state (simplified - STX only for Day 1-4)
(define-map channels
  { subscriber: principal, service: principal }
  {
    deposit: uint,              ;; Original deposit amount (microSTX)
    rate-per-block: uint,       ;; Payment rate (microSTX per block)
    opened-at: uint             ;; Block height when opened
  }
)

;; Service registry (optional, can be added later)
(define-map services
  principal
  { active: bool }
)
```

### Step 3: Implement open-channel

```clarity
;; Open a subscription channel
(define-public (open-channel 
  (service principal)
  (deposit uint)
  (rate-per-block uint))
  (let (
    (channel-key { subscriber: tx-sender, service: service })
  )
    ;; Verify channel doesn't exist
    (asserts! (is-none (map-get? channels channel-key)) ERR-CHANNEL-EXISTS)
    
    ;; Transfer STX to contract
    (try! (stx-transfer? deposit tx-sender (as-contract tx-sender)))
    
    ;; Create channel
    (ok (map-set channels channel-key {
      deposit: deposit,
      rate-per-block: rate-per-block,
      opened-at: block-height
    }))
  )
)
```

### Step 4: Implement verify-payment (READ-ONLY)

```clarity
;; Verify subscription is active (READ-ONLY - NO WRITES)
(define-read-only (verify-payment 
  (subscriber principal)
  (service principal))
  (let (
    (channel-key { subscriber: subscriber, service: service })
    (channel-data (unwrap! (map-get? channels channel-key) ERR-NOT-FOUND))
    (elapsed-blocks (- block-height (get opened-at channel-data)))
    (consumed-raw (* elapsed-blocks (get rate-per-block channel-data)))
    ;; CRITICAL: Prevent underflow
    (consumed (if (> consumed-raw (get deposit channel-data)) 
                  (get deposit channel-data) 
                  consumed-raw))
    (remaining (- (get deposit channel-data) consumed))
  )
    (ok {
      active: (> remaining u0),
      remaining: remaining,
      deposit: (get deposit channel-data),
      rate: (get rate-per-block channel-data),
      opened-at: (get opened-at channel-data)
    })
  )
)
```

### Step 5: Write Basic Clarinet Tests

**File**: `tests/subscription-channel_test.ts`

```typescript
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Can open a subscription channel",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const subscriber = accounts.get('wallet_1')!;
        const service = accounts.get('wallet_2')!;
        
        let block = chain.mineBlock([
            Tx.contractCall(
                'subscription-channel',
                'open-channel',
                [
                    types.principal(service.address),
                    types.uint(1000000), // 1 STX
                    types.uint(100)      // 100 microSTX per block
                ],
                subscriber.address
            )
        ]);
        
        assertEquals(block.receipts.length, 1);
        assertEquals(block.receipts[0].result, '(ok true)');
    },
});

Clarinet.test({
    name: "Verify-payment drains balance mathematically",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const subscriber = accounts.get('wallet_1')!;
        const service = accounts.get('wallet_2')!;
        
        // Open channel
        let block = chain.mineBlock([
            Tx.contractCall(
                'subscription-channel',
                'open-channel',
                [
                    types.principal(service.address),
                    types.uint(1000), // 1000 microSTX deposit
                    types.uint(10)    // 10 microSTX per block
                ],
                subscriber.address
            )
        ]);
        
        // Advance 50 blocks
        chain.mineEmptyBlockUntil(block.height + 50);
        
        // Verify payment - should show 500 consumed, 500 remaining
        let verifyBlock = chain.mineBlock([
            Tx.contractCall(
                'subscription-channel',
                'verify-payment',
                [
                    types.principal(subscriber.address),
                    types.principal(service.address)
                ],
                subscriber.address
            )
        ]);
        
        // Assert remaining balance is 500 (1000 - 50*10)
        // verifyBlock.receipts[0].result should contain remaining: u500
    },
});

Clarinet.test({
    name: "Underflow protection works when consumed > deposit",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const subscriber = accounts.get('wallet_1')!;
        const service = accounts.get('wallet_2')!;
        
        // Open channel with small deposit
        let block = chain.mineBlock([
            Tx.contractCall(
                'subscription-channel',
                'open-channel',
                [
                    types.principal(service.address),
                    types.uint(100),  // Small deposit
                    types.uint(10)    // High rate
                ],
                subscriber.address
            )
        ]);
        
        // Advance 50 blocks (would consume 500, but deposit is only 100)
        chain.mineEmptyBlockUntil(block.height + 50);
        
        // Verify - should show active: false, remaining: u0
        let verifyBlock = chain.mineBlock([
            Tx.contractCall(
                'subscription-channel',
                'verify-payment',
                [
                    types.principal(subscriber.address),
                    types.principal(service.address)
                ],
                subscriber.address
            )
        ]);
        
        // Should not throw underflow error, should gracefully show 0
    },
});
```

**Day 1 Success Criteria**: 
- ✅ Clarinet project initialized
- ✅ `open-channel` works
- ✅ `verify-payment` returns correct mathematical balance
- ✅ Tests pass

---

## DAY 2: SETTLEMENT & EDGE CASES

### Step 1: Implement close-channel

```clarity
;; Close channel and settle balances
(define-public (close-channel (service principal))
  (let (
    (channel-key { subscriber: tx-sender, service: service })
    (channel-data (unwrap! (map-get? channels channel-key) ERR-NOT-FOUND))
    (elapsed-blocks (- block-height (get opened-at channel-data)))
    (consumed-raw (* elapsed-blocks (get rate-per-block channel-data)))
    (consumed (if (> consumed-raw (get deposit channel-data)) 
                  (get deposit channel-data) 
                  consumed-raw))
    (remaining (- (get deposit channel-data) consumed))
  )
    ;; Transfer remaining balance back to subscriber
    (if (> remaining u0)
        (try! (as-contract (stx-transfer? remaining tx-sender tx-sender)))
        true)
    
    ;; Transfer earned amount to service provider
    (if (> consumed u0)
        (try! (as-contract (stx-transfer? consumed tx-sender service)))
        true)
    
    ;; Delete channel
    (map-delete channels channel-key)
    
    (ok { consumed: consumed, refunded: remaining })
  )
)
```

### Step 2: Implement force-close (timeout protection)

```clarity
;; Constants for testing vs production
(define-constant FORCE-CLOSE-TIMEOUT u10)  ;; 10 blocks for testing
;; In production, use: (define-constant FORCE-CLOSE-TIMEOUT u1008) ;; ~7 days

;; Force close if service provider unresponsive
(define-public (force-close-channel (subscriber principal) (service principal))
  (let (
    (channel-key { subscriber: subscriber, service: service })
    (channel-data (unwrap! (map-get? channels channel-key) ERR-NOT-FOUND))
    (elapsed-blocks (- block-height (get opened-at channel-data)))
  )
    ;; Can only force-close after timeout
    (asserts! (>= elapsed-blocks FORCE-CLOSE-TIMEOUT) ERR-UNAUTHORIZED)
    
    ;; Calculate settlement same as regular close
    (let (
      (consumed-raw (* elapsed-blocks (get rate-per-block channel-data)))
      (consumed (if (> consumed-raw (get deposit channel-data)) 
                    (get deposit channel-data) 
                    consumed-raw))
      (remaining (- (get deposit channel-data) consumed))
    )
      ;; Transfer remaining to subscriber
      (if (> remaining u0)
          (try! (as-contract (stx-transfer? remaining tx-sender subscriber)))
          true)
      
      ;; Transfer earned to service
      (if (> consumed u0)
          (try! (as-contract (stx-transfer? consumed tx-sender service)))
          true)
      
      ;; Delete channel
      (map-delete channels channel-key)
      
      (ok { consumed: consumed, refunded: remaining })
    )
  )
)
```

### Step 3: Add Comprehensive Tests

Add to `tests/subscription-channel_test.ts`:

```typescript
Clarinet.test({
    name: "Close channel settles correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        // Open channel, advance time, close, verify balances
    },
});

Clarinet.test({
    name: "Force-close works after timeout",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        // Open channel, advance >10 blocks, force-close as subscriber
    },
});

Clarinet.test({
    name: "Force-close fails before timeout",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        // Open channel, try force-close at 5 blocks, should fail
    },
});
```

### Step 4: Deploy to Testnet

```bash
# Configure testnet in Clarinet.toml
clarinet integrate

# Deploy
clarinet deployments apply -p testnet
```

**Day 2 Success Criteria**:
- ✅ `close-channel` settles correctly
- ✅ `force-close-channel` has timeout protection
- ✅ All edge case tests pass (underflow, timeout, etc.)
- ✅ Deployed to Stacks testnet
- ✅ Test coverage >95%

---

## DAY 3: X402 MIDDLEWARE

### Step 1: Initialize TypeScript Project

```bash
mkdir -p src/middleware src/client src/demo
npm init -y
npm install express @stacks/transactions @stacks/network
npm install -D @types/express @types/node typescript
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  }
}
```

### Step 2: Implement x402 Middleware

**File**: `src/middleware/x402-subscription.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { callReadOnlyFunction, cvToJSON, principalCV } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

interface X402Config {
  contractAddress: string;
  contractName: string;
  network: 'testnet' | 'mainnet';
  serviceAddress: string;
}

export function x402SubscriptionMiddleware(config: X402Config) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const subscriberId = req.headers['x-subscriber-id'] as string;
    
    if (!subscriberId) {
      return res.status(402).json({
        error: 'Payment Required',
        message: 'Open a subscription channel first',
        instructions: 'POST /api/channels/open with {deposit, ratePerBlock}'
      });
    }

    try {
      // Query Clarity contract (READ-ONLY - NO WRITE)
      const network = config.network === 'testnet' ? new StacksTestnet() : new StacksMainnet();
      
      const result = await callReadOnlyFunction({
        contractAddress: config.contractAddress,
        contractName: config.contractName,
        functionName: 'verify-payment',
        functionArgs: [
          principalCV(subscriberId),
          principalCV(config.serviceAddress)
        ],
        network,
        senderAddress: subscriberId
      });

      const response = cvToJSON(result);
      
      if (!response.value || !response.value.active) {
        return res.status(402).json({
          error: 'Subscription Expired',
          message: 'Insufficient balance in channel',
          remainingBalance: response.value?.remaining || '0',
          instructions: 'Close and reopen channel, or wait for existing to expire'
        });
      }

      // Access granted - no write transaction needed
      next();
      
    } catch (error) {
      console.error('Channel verification failed:', error);
      return res.status(500).json({
        error: 'Verification Failed',
        message: error.message
      });
    }
  };
}
```

### Step 3: Create Demo API Server

**File**: `src/demo/premium-api.ts`

```typescript
import express from 'express';
import { x402SubscriptionMiddleware } from '../middleware/x402-subscription';

const app = express();
app.use(express.json());

// Configuration (replace with your deployed contract)
const CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const CONTRACT_NAME = 'subscription-channel';
const SERVICE_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Your service wallet

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

// Public health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'x402 subscription service running' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 x402 Premium API running on http://localhost:${PORT}`);
  console.log(`📡 Premium endpoints require active STX subscription`);
});
```

**Day 3 Success Criteria**:
- ✅ Middleware compiles and runs
- ✅ Returns 402 when no subscriber-id
- ✅ Queries Clarity contract correctly
- ✅ Allows access when balance sufficient
- ✅ Manual test with curl works

---

## DAY 4: CLIENT SDK & AGENT DEMO

### Step 1: Implement Client SDK

**File**: `src/client/subscription-client.ts`

```typescript
import { makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, principalCV, uintCV } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

export class BitSubClient {
  private network: StacksTestnet;
  
  constructor(
    private privateKey: string,
    private contractAddress: string,
    private contractName: string
  ) {
    this.network = new StacksTestnet();
  }

  async openChannel(
    serviceAddress: string,
    depositAmount: bigint,
    ratePerBlock: bigint
  ): Promise<string> {
    const txOptions = {
      contractAddress: this.contractAddress,
      contractName: this.contractName,
      functionName: 'open-channel',
      functionArgs: [
        principalCV(serviceAddress),
        uintCV(depositAmount),
        uintCV(ratePerBlock)
      ],
      senderKey: this.privateKey,
      network: this.network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow
    };

    const transaction = await makeContractCall(txOptions);
    const txId = await broadcastTransaction(transaction, this.network);
    
    console.log(`✅ Channel opened. Transaction: ${txId}`);
    return txId;
  }

  async closeChannel(serviceAddress: string): Promise<string> {
    const txOptions = {
      contractAddress: this.contractAddress,
      contractName: this.contractName,
      functionName: 'close-channel',
      functionArgs: [principalCV(serviceAddress)],
      senderKey: this.privateKey,
      network: this.network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow
    };

    const transaction = await makeContractCall(txOptions);
    const txId = await broadcastTransaction(transaction, this.network);
    
    console.log(`🔒 Channel closed. Transaction: ${txId}`);
    return txId;
  }
}
```

### Step 2: Create Terminal Agent Demo

**File**: `src/demo/agent.ts`

```typescript
import { BitSubClient } from '../client/subscription-client';
import fetch from 'node-fetch';

const PRIVATE_KEY = 'your-testnet-private-key-here';
const CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const CONTRACT_NAME = 'subscription-channel';
const SERVICE_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const API_ENDPOINT = 'http://localhost:3000';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDemo() {
  console.log('='.repeat(60));
  console.log('BitSub: Bitcoin Subscriptions via x402 - Terminal Demo');
  console.log('='.repeat(60));
  
  const client = new BitSubClient(PRIVATE_KEY, CONTRACT_ADDRESS, CONTRACT_NAME);

  // Open channel
  console.log('\n🔓 Opening subscription channel...');
  console.log(`   Deposit: 1 STX (1,000,000 microSTX)`);
  console.log(`   Rate: 100 microSTX per block (~0.0001 STX/block)`);
  
  await client.openChannel(
    SERVICE_ADDRESS,
    1000000n,  // 1 STX deposit
    100n       // 100 microSTX per block
  );
  
  console.log('   Waiting for confirmation...');
  await sleep(30000); // Wait ~30s for block
  
  // Make requests
  console.log('\n📡 Making requests to premium API...');
  console.log('   Subscriber ID: ' + PRIVATE_KEY.slice(0, 10) + '...');
  
  let successCount = 0;
  let failureCount = 0;
  
  for (let i = 1; i <= 1000; i++) {
    try {
      const response = await fetch(`${API_ENDPOINT}/api/premium/weather`, {
        headers: {
          'x-subscriber-id': PRIVATE_KEY
        }
      });

      if (response.status === 200) {
        const data = await response.json();
        successCount++;
        
        if (i % 100 === 0) {
          console.log(`   ✅ Request ${i}: ${data.temperature}°F`);
        }
      } else if (response.status === 402) {
        const error = await response.json();
        console.log(`\n❌ Subscription expired at request ${i}`);
        console.log(`   Remaining balance: ${error.remainingBalance}`);
        failureCount++;
        break;
      }
      
      await sleep(1000); // 1 request per second
      
    } catch (error) {
      console.error(`   ❌ Request ${i} failed:`, error.message);
      failureCount++;
      break;
    }
  }
  
  // Close channel
  console.log(`\n🔒 Closing channel and settling...`);
  await client.closeChannel(SERVICE_ADDRESS);
  
  console.log('\n' + '='.repeat(60));
  console.log('DEMO SUMMARY');
  console.log('='.repeat(60));
  console.log(`Successful requests: ${successCount}`);
  console.log(`Failed requests: ${failureCount}`);
  console.log(`On-chain transactions: 2 (open + close)`);
  console.log(`Gas savings: ${(1 - 2/successCount) * 100}%`);
  console.log('='.repeat(60));
}

runDemo().catch(console.error);
```

**Day 4 Success Criteria**:
- ✅ Client SDK can open/close channels
- ✅ Agent demo runs in terminal
- ✅ Makes 1000 requests successfully
- ✅ Gets 402 when balance depletes
- ✅ Logs show clear progression

---

## DAY 5: DOCUMENTATION

### README.md Template

```markdown
# BitSub: Bitcoin Subscriptions via x402

**The first way to run continuous subscriptions on Bitcoin.**

## What This Is

BitSub enables continuous subscription access using payment channels on Stacks. Services stay open while STX micropayments stream, and automatically cut off when the channel balance depletes.

**Key Innovation**: 1000 subscription requests = 2 on-chain transactions (99.8% gas reduction)

## How It Works

1. Subscriber opens a payment channel with a deposit
2. Balance drains mathematically based on elapsed blocks
3. Service checks balance via read-only Clarity function
4. Access granted if `remaining = deposit - (elapsed_blocks × rate) > 0`
5. Access revoked automatically when balance hits zero
6. Channel closes with final settlement

## Architecture

[Insert architecture diagram]

**Read-Only Verification Model**:
- No per-request write transactions
- Balance calculated: `remaining = deposit - ((block-height - opened-at) × rate)`
- Middleware queries contract state, never modifies it

## Quick Start

[Installation and usage instructions]

## Demo

Watch the 5-minute demo: [YouTube link]

See the terminal demo:
```bash
npm run demo
```

## Technical Details

- **Contract**: `subscription-channel.clar`
- **Blockchain**: Stacks testnet
- **Token**: STX (sBTC support coming soon)
- **Testnet Address**: [Your deployed contract]

## Why This Matters

Enables:
- SaaS on Bitcoin
- AI agent subscriptions
- Streaming content monetization
- Premium data feeds with auto-cutoff

## Repository Structure

[Explain folder structure]

## Testing

```bash
clarinet test
npm test
```

## License

MIT
```

**Day 5 Success Criteria**:
- ✅ Comprehensive README
- ✅ Architecture diagrams
- ✅ Code comments added
- ✅ Usage examples clear

---

## DAY 6: VIDEO & SUBMISSION

### Video Script (5 Minutes)

**0:00-0:30 - Problem**
- "Subscriptions don't exist on Bitcoin"
- Show per-request transactions are expensive
- "With institutions entering Stacks via Fireblocks, we need subscription infrastructure"

**0:30-1:30 - Demo**
- Terminal showing agent opening channel
- 1000 requests scrolling
- Balance depleting
- 402 at zero
- Channel closing

**1:30-2:30 - How It Works**
- Show Clarity contract with read-only model
- Explain mathematical balance drain
- "1000 payments = 2 on-chain tx"

**2:30-3:30 - Why This Matters**
- Enables SaaS on Bitcoin
- Infrastructure layer
- Built for institutional moment

**3:30-5:00 - Technical Deep Dive**
- Show code
- Explain edge cases (underflow protection)
- GitHub link

### Record Video

```bash
# Use OBS or QuickTime
# Record terminal demo
# Narrate over it
# Upload to YouTube
```

### Submit to GitHub

```bash
git init
git add .
git commit -m "BitSub: Bitcoin Subscriptions via x402"
git remote add origin https://github.com/yourusername/bitsub
git push -u origin main
```

**Day 6 Success Criteria**:
- ✅ 5-minute video recorded
- ✅ GitHub repository public
- ✅ All links working
- ✅ Submission complete

---

## CRITICAL REMINDERS FOR CLAUDE CODE

1. **Verification is READ-ONLY**: Never write `update-verification` or any per-request write function. Balance drains mathematically.

2. **Underflow Protection**: Always use `(if (> consumed-raw deposit) deposit consumed-raw)` to prevent underflow.

3. **STX-Only First**: Don't try multi-token until Day 5. Get STX working perfectly first.

4. **Test Edge Cases**: Underflow, timeout, zero balance - these are what separate good from great.

5. **Terminal Demo > Dashboard**: Focus on working E2E in terminal. Dashboard is optional.

6. **Function Arguments**: `verify-payment` takes TWO principals (subscriber + service), not one.

7. **Testing Timeouts**: Use 10 blocks for testing, document that production uses 1008.

8. **No Dashboard Unless Ahead**: Only build UI if you finish E2E by end of Day 4.

---

## SUCCESS CRITERIA CHECKLIST

### Must-Have (Minimum Viable Submission)
- [ ] Clarity contract deployed to testnet
- [ ] `open-channel`, `verify-payment`, `close-channel` all working
- [ ] x402 middleware returns 402 correctly
- [ ] Terminal agent demo makes 1000 requests
- [ ] README with clear documentation
- [ ] 5-minute video demo
- [ ] GitHub repository public

### Nice-to-Have (If Time Permits)
- [ ] sBTC token support
- [ ] USDCx token support
- [ ] Dashboard UI
- [ ] Force-close tested on mainnet

---

## TROUBLESHOOTING

**Issue**: Clarinet tests fail with underflow
**Fix**: Add `(if (> consumed-raw deposit) deposit consumed-raw)` check

**Issue**: Middleware always returns 402
**Fix**: Check you're passing BOTH principals to `verify-payment`

**Issue**: Balance doesn't drain
**Fix**: Verify `block-height - opened-at` calculation is correct

**Issue**: Can't deploy to testnet
**Fix**: Check Clarinet.toml has correct network config

---

## FINAL NOTES

This is everything you need to build BitSub in 7 days. The architecture is solid (Opus-validated), the scope is realistic (STX-only, terminal demo), and the plan is concrete.

**Focus on Days 1-4**. If the contracts and E2E demo work by Day 4, you're in great shape. Days 5-6 are polish and submission.

**The winning move**: Execute the core perfectly. Don't overbuild.

Good luck! 🚀
