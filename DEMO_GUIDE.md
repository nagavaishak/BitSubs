# BitSubs Demo Video Guide

**Duration Target**: 3-5 minutes
**Hackathon**: x402 Stacks Challenge (Feb 9-16, 2026)

---

## Pre-Recording Checklist

✅ **Verify all services are running:**
```bash
# API Server (port 3000)
curl http://localhost:3000/health

# Dashboard (port 3001)
# Open in browser: http://localhost:3001
```

✅ **Prepare browser tabs:**
- Tab 1: Dashboard (http://localhost:3001)
- Tab 2: Stacks Explorer (https://explorer.hiro.so/txid/6dcf04602d18d9208c44bb5b83052af232089e469cf0b116d67fd77e744a2743?chain=testnet)
- Tab 3: Terminal (for live demo)

✅ **Clear terminal history:**
```bash
clear
```

---

## Demo Script (3-5 minutes)

### 1. Hook (15 seconds)

**Visual**: Show dashboard landing page

**Script**:
> "Hi, I'm [name] and I built BitSubs - the first way to run continuous subscriptions on Bitcoin. We're solving a massive problem: traditional subscription payments on blockchain require one transaction per payment. BitSubs achieves 99.8% gas reduction using payment channels."

---

### 2. Problem Statement (30 seconds)

**Visual**: Scroll through landing page to features section

**Script**:
> "Here's the problem: If you want to run a subscription API on Bitcoin or Stacks, you have two bad options. Option 1: charge per request - your users pay gas fees every single time. 1000 API calls = 1000 on-chain transactions. Option 2: trust-based billing - defeats the whole point of crypto.
>
> BitSubs solves this with payment channels. 1000 requests = only 2 on-chain transactions."

---

### 3. How It Works (45 seconds)

**Visual**: Scroll to payment flow timeline on dashboard

**Script**:
> "Here's how it works. Step 1: A subscriber opens a payment channel with an STX deposit. Step 2: The channel balance drains mathematically based on elapsed blocks. Step 3: Our middleware verifies the channel state using a read-only Clarity function. Step 4: Access is granted if the balance is positive, automatically revoked when it hits zero. Step 5: The channel closes with final settlement.
>
> This is implemented using the x402 payment protocol - an HTTP 402 standard for payment-required responses on Stacks."

---

### 4. Live Demo (90 seconds)

**Visual**: Switch to terminal

**Script**:
> "Let me show you this working live. I'll run an autonomous agent that makes 1000 API requests to a premium weather service."

```bash
cd /Users/shashank/Desktop/Hackathon\ projects/BitSubs
node dist/demo/agent.js
```

**Wait for output to start showing:**

> "Watch what happens. First request: 402 Payment Required - the server returns x402 payment instructions. The client reads these instructions and opens a channel on-chain. Channel opened successfully.
>
> Now watch - all subsequent requests succeed using the SAME channel. Request 2, 3, 4... hundreds of requests... all verified through the payment channel with ZERO additional on-chain transactions."

**Let it run for ~30 seconds showing rapid successful requests**

**Script**:
> "This is real. Every verification is checking the on-chain Clarity contract, but using read-only calls - no gas fees."

---

### 5. Architecture Deep Dive (30 seconds)

**Visual**: Switch to VS Code showing key files

**File 1**: `bitsubs/contracts/subscription-channel.clar` (lines 20-35)

**Script**:
> "The core magic is in our Clarity smart contract. The verify-payment function is read-only - it calculates remaining balance mathematically: deposit minus elapsed blocks times rate. Pure computation, no state writes."

**File 2**: `src/middleware/x402-subscription.ts` (lines 15-45)

**Script**:
> "Our Express middleware implements the x402 protocol. When a request arrives without payment proof, we return 402 with standardized payment instructions. When the client retries with proof, we verify the signature and channel state on-chain."

---

### 6. On-Chain Verification (20 seconds)

**Visual**: Switch to Stacks Explorer tab

**Script**:
> "Here's our deployed contract on Stacks testnet. You can see the open-channel transaction here. This is the ONLY transaction for potentially thousands of API requests."

**Point to transaction details**

---

### 7. Dashboard Visualization (20 seconds)

**Visual**: Switch back to dashboard, scroll through demo section

**Script**:
> "Our dashboard visualizes the entire flow in real-time - channel status, balance draining, live request feed, and statistics. Notice the gas savings: 99.8% reduction."

---

### 8. Technical Highlights (20 seconds)

**Visual**: Show stats section on dashboard

**Script**:
> "Key metrics: 1000 requests processed, only 2 on-chain transactions, mathematical balance verification, x402 protocol compliance, and full testnet deployment."

---

### 9. Use Cases & Closing (20 seconds)

**Visual**: Scroll to use cases section

**Script**:
> "This enables real Bitcoin-native subscriptions: SaaS platforms, AI agents with autonomous payments, streaming content, premium data feeds, IoT device access - all without recurring credit card charges or per-request gas fees.
>
> BitSubs is the first x402 implementation for continuous subscriptions, combining standardized payment protocols with payment channels. Check out the repo at github.com/[your-username]/bitsubs. Thank you!"

---

## Recording Tips

### Technical Setup
- **Screen resolution**: 1920x1080 (Full HD)
- **Recording software**: OBS Studio, Loom, or QuickTime
- **Frame rate**: 30 FPS minimum
- **Audio**: Clear microphone, minimize background noise

### Visual Tips
- **Cursor**: Make it larger and highlighted
- **Terminal font size**: Increase to 16-18pt for readability
- **Browser zoom**: 125-150% for dashboard visibility
- **Clean desktop**: Hide unnecessary windows/icons

### Presentation Tips
- **Pace**: Speak clearly but energetically
- **Enthusiasm**: Show excitement about the innovation
- **Technical depth**: Don't dumb it down - judges know blockchain
- **Confidence**: You built something genuinely novel

### Common Mistakes to Avoid
- ❌ Apologizing for bugs (they're features!)
- ❌ Reading from a script robotically
- ❌ Going over time (5 minutes max)
- ❌ Forgetting to show the actual working code
- ❌ Not emphasizing the 99.8% gas reduction

---

## Post-Recording Checklist

- [ ] Video length under 5 minutes
- [ ] Audio is clear
- [ ] All code/terminal text is readable
- [ ] Live demo shows successful requests
- [ ] x402 protocol mentioned
- [ ] Gas savings (99.8%) emphasized
- [ ] GitHub repo linked
- [ ] Contract address visible

---

## Emergency Backup

If the live demo fails during recording:

**Option 1**: Show pre-recorded terminal output
```bash
# Show the completed test output
cat /private/tmp/claude-501/-Users-shashank-Desktop-Hackathon-projects-BitSubs/tasks/b009a5c.output
```

**Option 2**: Explain the flow while showing code
- Walk through `agent.ts` showing the request loop
- Show `x402-subscription.ts` showing verification logic
- Show contract code showing balance calculation

**Option 3**: Focus on architecture
- Emphasize the mathematical correctness
- Show test results (13/13 tests passing)
- Show explorer transaction

---

## Key Talking Points (If You Forget)

1. **Problem**: 1000 payments traditionally = 1000 transactions
2. **Solution**: Payment channels reduce to 2 transactions (99.8% savings)
3. **Innovation**: First x402 implementation for continuous subscriptions
4. **Technical**: Read-only verification, no per-request writes
5. **Protocol**: Full x402 compliance with standardized schema
6. **Blockchain**: Deployed on Stacks testnet, Clarity smart contracts
7. **Use Cases**: SaaS, AI agents, streaming, data feeds, IoT

---

## Submission Checklist

- [ ] Demo video recorded and uploaded
- [ ] GitHub repo is public
- [ ] README.md is comprehensive
- [ ] Contract deployed and verified on testnet
- [ ] All code is commented and clean
- [ ] Tests are passing (13/13)
- [ ] x402 compliance documented

---

**Good luck! You built something genuinely innovative. Show it off with confidence!** 🚀
