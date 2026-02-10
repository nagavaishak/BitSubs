# BitSubs Demo Quick Reference Card

## 🚀 Quick Start Commands

```bash
# Start API Server (Terminal 1)
npm run server

# Start Dashboard (Terminal 2)
cd dashboard && npm run dev

# Run Demo Agent (Terminal 3)
npm run demo
```

---

## 📊 Key Numbers to Mention

- **99.8%** gas reduction
- **2** on-chain transactions (vs 1000 traditional)
- **1000** API requests in demo
- **13/13** tests passing
- **< 100ms** verification latency

---

## 🔗 Important URLs

**Dashboard**: http://localhost:3001
**API Health**: http://localhost:3000/health
**Contract Explorer**: https://explorer.hiro.so/txid/6dcf04602d18d9208c44bb5b83052af232089e469cf0b116d67fd77e744a2743?chain=testnet

**Contract Address**: `STDJM59BQ5320FM808QWEVP4JXH0R9BYS4Q0YE6C.subscription-channel`

---

## 💬 Key Phrases

1. "First x402 implementation for continuous subscriptions"
2. "Payment channels on Stacks blockchain"
3. "99.8% gas reduction through read-only verification"
4. "Bitcoin-native subscriptions without credit cards"
5. "Autonomous AI agents with streaming payments"

---

## 🎯 Demo Flow (2 minutes)

1. **Show dashboard** (15s) - Landing page
2. **Explain problem** (20s) - Traditional = 1 tx per payment
3. **Show architecture** (20s) - Payment flow diagram
4. **Run live demo** (45s) - Terminal with agent
5. **Show contract** (10s) - Explorer page
6. **Close** (10s) - Use cases + repo

---

## 🐛 Troubleshooting

**Agent fails?**
```bash
# Check API is running
curl http://localhost:3000/health

# Restart if needed
npm run server
```

**Port conflicts?**
```bash
# Kill existing processes
lsof -ti:3000,3001 | xargs kill -9
```

**Dashboard not loading?**
```bash
cd dashboard && npm run dev
```

---

## 📝 Script Template (30 seconds)

> "BitSubs enables Bitcoin-native subscriptions using payment channels on Stacks. Traditional approach: 1000 payments = 1000 transactions. BitSubs: 1000 payments = 2 transactions. That's 99.8% gas reduction.
>
> We implement the x402 payment protocol - when you hit a protected endpoint, you get a 402 response with payment instructions. Open a channel once, then stream hundreds of payments with zero additional on-chain transactions.
>
> This enables SaaS on Bitcoin, autonomous AI agents, streaming content - all without credit cards or per-request fees. Watch it work live..."

[Run demo]

---

## ✅ Pre-Record Checks

- [ ] Clear terminal: `clear`
- [ ] Check services: `curl localhost:3000/health`
- [ ] Open dashboard: http://localhost:3001
- [ ] Terminal font size: 16-18pt
- [ ] Browser zoom: 125-150%
- [ ] Silence notifications
- [ ] Close unnecessary apps

---

**YOU GOT THIS! 🚀**
