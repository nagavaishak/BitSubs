# BitSubs Demo Script — 6:30 to Win

**Total time: 6:30 (speed to 1.25x if needed for 5:00 limit)**

**Rule: Every second shows something live. No slides. No static screenshots. Only real, working code.**

---

## 🎬 PRE-RECORDING SETUP

### Screen Layout (before hitting record)

**Desktop 1 - Terminals:**
1. **Terminal 1 (left half)**:
   ```bash
   cd /Users/shashank/Desktop/Hackathon\ projects/BitSubs
   # Type but DON'T run yet:
   curl -s https://bitsubs-production.up.railway.app/api/premium/weather | python3 -m json.tool
   ```

2. **Terminal 2 (right half)**:
   ```bash
   cd /Users/shashank/Desktop/Hackathon\ projects/BitSubs
   # Ready to run:
   npm run demo
   ```

**Desktop 2 - Browser (Chrome/Firefox):**

Open these tabs IN THIS ORDER (left to right):

1. **Tab 1**: https://bitsubs.vercel.app (landing page, scroll to top)
2. **Tab 2**: https://bitsubs.vercel.app (click `/economy` BEFORE recording, let it load with ACTIVE channels)
3. **Tab 3**: https://bitsubs.vercel.app (stay on landing, ready to click "Real Wallet Demo")
4. **Tab 4**: https://explorer.hiro.so/txid/49ad441c47246c6e95ce332fce14bab0fc5927da2113410b58478aae0fa187ac?chain=testnet
5. **Tab 5**: file:///Users/shashank/Downloads/bitsubs-architecture-v2.html (your architecture diagram - FULLSCREEN THIS)

**Desktop 3 - VS Code:**

Open these files in tabs:
1. `src/middleware/x402-subscription.ts` (scroll to line 64 - the middleware function)
2. `bitsubs/contracts/subscription-channel.clar` (scroll to line 60 - verify-payment function)

**Pre-flight checklist:**
- [ ] Economy page shows ACTIVE channels (both Agent 2 and Agent 3)
- [ ] Leather wallet is installed and unlocked (for wallet demo)
- [ ] Clear terminal history (no clutter)
- [ ] Close all other apps (notifications off, DND mode on)
- [ ] Test `npm run demo` runs without errors
- [ ] Check audio levels

---

## [0:00 - 0:08] OPENING - SILENCE + CURL

**Screen: Terminal 1 (fullscreen)**

**Action:** Type the curl command slowly (like you're thinking):
```bash
curl -s https://bitsubs-production.up.railway.app/api/premium/weather | python3 -m json.tool
```

Hit enter. 402 JSON appears, nicely formatted.

**Say nothing for 2 full seconds.** Let the 402 response sit on screen.

---

## [0:08 - 0:35] THE PROBLEM (27 seconds)

**Screen: Stay on Terminal 1 with 402 response visible**

**Say:**

> "402 Payment Required. x402 on Bitcoin. Works perfectly — for one request."

*Pause 1 beat.*

> "But here's the question nobody's asking. What happens when an AI agent needs this API ten thousand times? With standard x402, that's ten thousand on-chain transactions. At Stacks gas costs — that's unusable."

*Pause 1 beat.*

> "Every x402 project you've seen today has this problem. We solved it."

*Pause 1 beat.*

> "Two transactions. Open a channel. Close a channel. Everything in between — zero gas."

---

## [0:35 - 1:50] LIVE AGENT DEMO (75 seconds)

**Screen: Switch to Terminal 2 (fullscreen)**

**Say:**

> "Real agent. Real wallet. Real Stacks testnet."

**Action:** Run `npm run demo` and hit enter immediately.

Banner appears. Channel opening message appears.

**Say:**

> "Watch. It hits the API — 402. Reads the x402 v2 payment instructions — network, token, contract call. Opens a subscription channel on-chain. Transaction one."

Requests start streaming (green 200s).

**Say:**

> "Now it's consuming data. Request after request. But here's the key — every single one is verified through a read-only call to our Clarity contract. Not a write. Not a transaction. A math check."

*Let requests stream for 3-4 seconds in silence.*

> "The balance isn't stored and decremented — it's calculated live. Deposit minus elapsed blocks times rate. Pure math. Zero gas."

**[SPEED UP RECORDING HERE 2-3x while requests stream]** — Don't speed up your voice, just speed up the video during the request loop (requests 5-25) so the counter climbs fast. Slow back to normal at request ~28.

**[SLOW BACK TO NORMAL after 25-30 requests]**

Demo stops after 30 requests. Message appears: "Demo limit reached..."

**Say:**

> "That was **30 requests**. The balance drains per block — not per request. In production, this channel would last days. For this demo, we're closing early to show you the settlement."

*Pause 1 beat.*

> "Watch. The agent closes the channel — transaction two."

Agent closes channel. TX ID appears.

*Pause 1 beat.*

> "Two on-chain transactions. 30 requests. 93% gas reduction. Not theoretical — you just watched it happen."

---

## [1:50 - 3:00] MULTI-AGENT ECONOMY (70 seconds)

**Screen: Switch to Browser Tab 2 (economy dashboard already loaded)**

**Say:**

> "One agent subscribing to an API is a demo. This is an economy."

Dashboard shows 3 agents, ACTIVE channels, arrows, data flowing.

**Say:**

> "Three AI agents. Running right now. On Stacks testnet. Paying each other for data through BitSubs subscription channels."

**Action:** Hover mouse over Weather Oracle card.

**Say:**

> "Agent One — Weather Oracle. Publishes premium weather and market data behind an x402 paywall."

**Action:** Hover over Trading Analyst card.

**Say:**

> "Agent Two — Trading Analyst. Has a subscription channel open to the Oracle. Every 30 seconds, it pays for weather data, runs analysis, and produces a trading signal."

**Action:** Point to the signal display (BUY @ 67% or whatever it shows).

**Say:**

> "Agent Three — Portfolio Manager. Subscribes to the Analyst's signal feed. Consumes it, makes allocation decisions."

**Action:** Point to portfolio percentages (BTC:55% ETH:25% STX:12% CASH:8%).

**Say:**

> "Three agents. A supply chain of data. Real STX flowing between them."

**Action:** Scroll down to stats bar at bottom.

**Say:**

> "Look at the numbers. **28 total requests** between these agents. **Two on-chain transactions**. Everything else — free read-only verification."

*Pause 1 beat.*

> "This is what agent infrastructure on Bitcoin looks like when it actually scales."

---

## [3:00 - 3:45] WALLET CONNECT DEMO (45 seconds)

**Screen: Switch to Browser Tab 3 (landing page)**

**Say:**

> "Agents can do this autonomously. Humans can too."

**Action:** Scroll down to "Real Wallet Demo" section. Click the button.

Wallet UI appears.

**Say:**

> "Connect any Stacks wallet — Leather, Xverse, Hiro. Open a subscription channel."

**Action:** Click "Connect Wallet". Leather popup appears. Click approve.

**Say:**

> "Real transaction. Real contract call."

**Action:** Make 2-3 test requests. Show the balance bar draining slightly.

**Say:**

> "Make requests. Watch the balance drain. When it hits zero — 402. No human decided that. The math decided it."

*Pause 1 beat.*

> "This is live right now at bitsubs.vercel.app. Any judge can try this after the video."

---

## [3:45 - 4:30] ARCHITECTURE (45 seconds)

**Screen: Switch to Browser Tab 5 (architecture diagram HTML - FULLSCREEN)**

**Action:** Show the architecture diagram fullscreen. Let it sit for 2 seconds.

**Say:**

> "Here's the entire system."

**Action:** Point to the top boxes (Human Client + AI Agent).

**Say:**

> "Two types of clients. Humans connect wallets — Leather, Xverse, Hiro. AI agents use our SDK. Both send the same proof — an x-payment-proof header with a Stacks signature."

**Action:** Point to the middle orange box (x402 Subscription Middleware).

**Say:**

> "Middleware layer. Three lines of code. Import our middleware, apply it to your Express route, done. It intercepts every request, calls the Clarity contract read-only, checks the balance. Zero gas. Zero writes."

**Action:** Point to the bottom left (Clarity Smart Contract box).

**Say:**

> "Chain layer. One smart contract. Two functions cost gas — open-channel, transaction one. Close-channel, transaction two. One function is free — verify-payment. That's the entire verification engine."

**Action:** Point to the formula at the bottom of the screen.

**Say:**

> "The formula. Remaining equals deposit minus elapsed blocks times rate. No database. No off-chain state. The blockchain does math, and math is free."

**Action:** Point to the stats bar at bottom (2, ∞, 99.8%, 0, 3 lines).

**Say:**

> "Two transactions. Infinite requests. 99.8% gas reduction. Zero writes per request. Three lines to integrate."

---

## [4:30 - 5:00] ON-CHAIN PROOF (30 seconds)

**Screen: Switch to Browser Tab 4 (Stacks Explorer)**

**Say:**

> "This is real. Deployed contract on Stacks testnet. Every channel open, every channel close — verifiable on the Hiro Explorer."

**Action:** Click on the contract deployment transaction. Show the contract code deployed.

**Say:**

> "Built with x402-stacks v2. CAIP-2 network identifiers. Base64 payment headers. Official package for protocol compliance, custom subscription architecture for the channel innovation."

---

## [5:00 - 5:25] THE CODE (25 seconds)

**Screen: Switch to VS Code - subscription-channel.clar file**

**Action:** Show the `verify-payment` function (line 60-82).

**Say:**

> "Five lines of Clarity. The entire verification engine."

**Action:** Let it sit for 3 seconds. Then switch to VS Code - x402-subscription.ts file.

**Action:** Show the middleware function (line 64-77).

**Say:**

> "And for developers — one import, one line of config. Your API now accepts Bitcoin subscriptions."

---

## [5:25 - 6:10] THE CLOSE (45 seconds)

**Screen: Switch back to Browser - Economy Dashboard (Tab 2)**

**Action:** Let the live economy dashboard fill the screen with ACTIVE channels visible.

**Say (look at camera if recording yourself, or just speak clearly):**

> "Let me be direct about what we built."

*Pause 1 beat.*

> "Every other x402 project here does pay-per-request. One API call, one blockchain transaction. That works for a demo. It does not work for production. It does not work for agents that need continuous access. It does not work for the economy that x402 is supposed to enable."

*Pause 1 beat.*

> "BitSubs solves this. Subscription channels on Bitcoin. Open once, access continuously, settle when done. The balance drains mathematically — no writes, no gas, no facilitator. Just a Clarity contract doing math."

*Pause 1 beat.*

> "We proved it works with a live multi-agent economy. Three AI agents paying each other for data, right now, on Stacks testnet. **28 requests. Two transactions**. Secured by Bitcoin."

*Pause 1 beat.*

> "We're not just x402 compliant. We're the first x402 implementation that actually scales."

---

## [6:10 - 6:30] END CARD (20 seconds)

**Screen: Stay on economy dashboard for 3 seconds, then switch to landing page (Tab 1)**

**Action:** Show bitsubs.vercel.app landing page briefly (2 seconds).

**Action:** Switch back to economy dashboard with live ACTIVE channels and flowing data.

**Say:**

> "BitSubs. Live at bitsubs.vercel.app. Try it yourself."

*Pause 2 beats.*

> "Bitcoin subscriptions. Without the gas."

**Action:** Hold on the economy dashboard for 3 full seconds. Let the ACTIVE channels and green stats be the last thing judges see.

**Fade to black.**

---

## 🎯 KEY NUMBERS TO MEMORIZE

Replace these in the script with ACTUAL numbers from a practice run:

- **Agent demo**: Will be exactly **30 requests** (hardcoded limit)
- **Economy stats**: Check `/api/stats` live — will vary (currently showing ~28-50 total requests between agents)
- **Gas reduction**: 30 requests with 2 txns = 93.3% reduction

## 🎬 RECORDING TIPS

### Before you start:
1. Do a full practice run (don't record). Time it. Adjust pacing.
2. Clear your terminal history: `clear` in both terminals
3. Restart the economy server to reset stats: `npm run server`
4. Make sure both economy channels are ACTIVE (refresh the page)
5. Close all notifications, turn on Do Not Disturb

### During recording:
- **Speak slowly and clearly** — you can always speed up the video, but you can't fix unclear audio
- **Pause between major points** — judges need time to process
- **Let visuals breathe** — when the agent demo is running, stay quiet for 3-4 seconds
- **Use the mouse** — point to things on screen (channel cards, balance bars, stats)

### After recording:
1. Speed up the agent demo request loop section (1:10-1:35) to 3x
2. Add subtle background music (optional, low volume)
3. Add text overlays for key stats (optional):
   - "2 transactions" when you say it
   - "99.8% gas reduction" when you say it
   - "bitsubs.vercel.app" at the end

## 🔥 WHAT MAKES THIS SCRIPT WIN

1. **Opens with silence** — dramatic, judges pay attention immediately
2. **Live everything** — curl a real API, run a real agent, show a real economy
3. **Builds up** — one agent → three agents → human wallet → code → on-chain proof
4. **Direct language** — "Let me be direct" hits harder than "So in conclusion..."
5. **Ends on the strongest visual** — live economy with ACTIVE channels, not a thank you slide

## 🚨 COMMON MISTAKES TO AVOID

- ❌ Don't say "um" or "basically" — cut it in editing if you do
- ❌ Don't speed up your voice — only speed up the video during silent agent loops
- ❌ Don't skip the pauses — they let points land
- ❌ Don't read the script word-for-word on camera — internalize it, sound natural
- ❌ Don't forget to fill in the actual numbers from your practice run

---

**You got this. Go record. Win first place.**
