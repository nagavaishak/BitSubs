# BitSubs Demo Script - 5 Minutes to Win

**Total time: 5:00**
**Rule: Never stop moving. Every second shows something live and real.**

---

## PRE-DEMO SETUP (before recording)

Open these tabs/windows BEFORE hitting record:

1. **Terminal 1**: Ready with `curl https://bitsubs-production.up.railway.app/api/premium/weather`
2. **Terminal 2**: Ready with `npm run demo` (in BitSubs project dir)
3. **Browser Tab 1**: https://bitsubs.vercel.app (landing page)
4. **Browser Tab 2**: https://bitsubs.vercel.app (click /economy BEFORE recording so it's loaded)
5. **Browser Tab 3**: https://explorer.hiro.so/txid/49ad441c47246c6e95ce332fce14bab0fc5927da2113410b58478aae0fa187ac?chain=testnet (contract)
6. **VS Code**: Open `src/middleware/x402-subscription.ts` (the 3-line middleware)

Test everything works. Refresh economy page, confirm ACTIVE channels.

---

## [0:00 - 0:30] THE HOOK (30 seconds)

**[Show Terminal 1]**

Say:
> "Every x402 implementation you've seen today has the same problem. Watch."

Run:
```bash
curl https://bitsubs-production.up.railway.app/api/premium/weather
```

**[402 response appears on screen]**

> "402 Payment Required. Standard x402. But here's the question nobody's answering: what happens when an AI agent needs to call this API a thousand times? Ten thousand times?"

> "With pay-per-request x402, that's ten thousand on-chain transactions. Thousands of dollars in gas. That doesn't work."

> "BitSubs fixes this. Two transactions. That's it. Open a channel, close a channel. Everything in between is free."

---

## [0:30 - 1:30] LIVE AGENT DEMO (60 seconds)

**[Switch to Terminal 2]**

Say:
> "Let me show you. This is a real autonomous agent with a real Stacks wallet."

Run:
```bash
npm run demo
```

**[Agent starts - banner appears, channel opens, requests stream]**

> "It hits the API. Gets a 402. Reads the x402 v2 payment instructions. Opens a subscription channel on-chain — that's transaction number one."

**[Requests streaming in - green 200s]**

> "Now watch. Request after request after request. Every single one is verified on-chain through a read-only call to our Clarity contract. Zero gas. Zero writes. The balance drains mathematically — not per request, but per block."

**[Point to the balance bar as it shows]**

> "See the balance? It's calculated as: deposit minus elapsed blocks times rate. No storage writes. Pure math."

**[When 402 hits or requests finish]**

> "And when the balance runs out — 402. Access revoked. Channel closes — that's transaction number two. Done."

> "Two on-chain transactions. For unlimited API calls. That's a 99.8% gas reduction."

---

## [1:30 - 2:30] MULTI-AGENT ECONOMY (60 seconds) - THE DIFFERENTIATOR

**[Switch to Browser Tab 2 - Economy Dashboard]**

Say:
> "But here's where it gets interesting. One agent paying for an API is nice. What about agents paying EACH OTHER?"

**[Economy dashboard is live - 3 agent cards, ACTIVE channels, arrows flowing]**

> "This is a live multi-agent economy running right now on Stacks testnet."

**[Point to each agent card]**

> "Three AI agents. Agent One — the Weather Oracle — publishes premium weather data behind an x402 paywall. Agent Two — the Trading Analyst — has a subscription channel open to Agent One. Every 30 seconds it pays for weather data, analyzes it, and produces a trading signal."

**[Point to the signal: BUY/SELL/HOLD]**

> "Agent Three — the Portfolio Manager — subscribes to Agent Two's signals. It consumes the signal, makes a portfolio allocation decision."

**[Point to portfolio: BTC:70% ETH:20% STX:8% CASH:2%]**

> "Three agents. Two subscription channels. Real STX flowing. Real on-chain verification. And look at the stats..."

**[Point to bottom stats bar]**

> "X total requests between these agents. Only 2 on-chain transactions. Everything else is verified through free read-only calls."

> "This is what AI agent infrastructure looks like on Bitcoin."

---

## [2:30 - 3:30] HOW IT WORKS - SMART CONTRACT (60 seconds)

**[Switch to Browser Tab 3 - Stacks Explorer]**

Say:
> "Let me show you this is real. Here's the deployed contract on Stacks testnet."

**[Show the contract on explorer - verified, deployed]**

> "The entire magic is in one read-only function."

**[Switch to VS Code or just say it]**

> "verify-payment. It takes a subscriber and service address, looks up the channel, and calculates: remaining equals deposit minus elapsed blocks times rate-per-block. If remaining is greater than zero, access granted. No writes. No gas. Just math."

> "The contract has three functions that cost gas: open-channel, close-channel, and force-close. Everything else — every verification, every API call — is a free read-only call."

**[Switch to VS Code - show middleware file briefly]**

> "And for developers — protecting your API takes three lines. Import our middleware, add it to your Express route, done. Your API now accepts Bitcoin subscriptions."

---

## [3:30 - 4:15] THE DASHBOARD (45 seconds)

**[Switch to Browser Tab 1 - Landing Page]**

Say:
> "We built a full dashboard at bitsubs.vercel.app."

**[Scroll through the landing page quickly]**

> "The x402 protocol flow visualized. The comparison — traditional x402 versus BitSubs."

**[Click "Real Wallet Demo" button]**

> "And this is a real wallet integration. Connect your Hiro or Leather wallet, and you can open a subscription channel, make verified requests, and close the channel — all from the browser. Real transactions, real contract calls."

**[Click /economy in nav]**

> "And the economy page — what you just saw — is polling our live API every 5 seconds. Real agents, real channels, real Bitcoin-secured infrastructure."

---

## [4:15 - 5:00] THE CLOSE (45 seconds)

**[Stay on economy dashboard or switch back to terminal]**

Say:
> "Let me put this in perspective."

> "Every other x402 implementation at this hackathon does pay-per-request. One API call, one transaction. That works for a demo. It does NOT work for production."

> "BitSubs solves this with subscription channels. Open once, stream forever, settle on-chain. Two transactions for unlimited access. 99.8% gas reduction."

> "We're not just x402 compliant — we're the first x402 implementation that actually scales. And we proved it with a live multi-agent economy where AI agents are paying each other for services right now, on Stacks testnet, secured by Bitcoin."

> "BitSubs. Bitcoin subscriptions without gas."

**[End on economy dashboard with ACTIVE channels visible]**

---

## KEY NUMBERS TO MEMORIZE

Drop these naturally throughout. Judges remember numbers:

- **2 transactions** for unlimited requests
- **99.8%** gas reduction
- **0 gas** per verification (read-only)
- **3 lines** to protect your API
- **3 agents** paying each other live
- **13/13** contract tests passing

## COMMON JUDGE QUESTIONS (prep answers)

**Q: How is this different from Lightning Network?**
> Lightning is for Bitcoin L1. We're on Stacks L2 using Clarity smart contracts with mathematical balance verification. No routing, no liquidity, no channel management complexity. One contract function opens a subscription.

**Q: What happens if the service goes down?**
> Force-close. The subscriber can call force-close-channel after a timeout (10 blocks on testnet, 7 days on mainnet) and recover their remaining deposit. It's trustless.

**Q: Why not just use a regular API key?**
> No accounts. No signup. No credit cards. No chargebacks. An AI agent with a Stacks wallet can subscribe to any BitSubs-protected API without human intervention. That's the unlock for autonomous agent economies.

**Q: Is the sBTC support real?**
> The contract has open-channel-sbtc ready. We're waiting for stable sBTC testnet availability. The x402 response already advertises both STX and sBTC as payment options.

**Q: How does the balance drain work?**
> Pure math. remaining = deposit - (current_block - opened_at) * rate_per_block. No writes, no storage updates. The balance is calculated on every read call. That's why verification is free.

## TONE

- Confident, not arrogant
- Fast-paced but clear
- Let the live demos speak — don't over-explain
- When something works live, pause for ONE second to let it land
- Never say "basically" or "essentially" — be direct
