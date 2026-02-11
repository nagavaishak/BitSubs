# BitSubs Demo Video Storyboard

**Target Length**: 3-5 minutes
**Format**: Screen recording with voiceover

---

## Shot List

### SHOT 1: Opening Hook (0:00 - 0:15)
**Visual**: Dashboard landing page (full screen)
- Clean, professional Stacks-style design
- "BitSubs" logo prominent
- Hero section: "Stream payments with Bitcoin L2"

**Voiceover**: "Hi, I'm [name] and I built BitSubs - the first way to run continuous subscriptions on Bitcoin..."

**Camera**: Static, dashboard fills screen

---

### SHOT 2: Problem Setup (0:15 - 0:45)
**Visual**: Scroll slowly through features section
- Show feature cards
- Highlight "99.8% gas reduction" stat

**Voiceover**: "Here's the problem we're solving. Traditional blockchain subscriptions require one transaction per payment..."

**Camera**: Smooth scroll, pause on key stats

---

### SHOT 3: Solution Architecture (0:45 - 1:30)
**Visual**: Timeline section with payment flow
- Show the 5-step process
- Animated flow diagram
- Highlight "Read-only verification"

**Voiceover**: "BitSubs solves this with payment channels. Here's how it works..."

**Camera**: Scroll to timeline, pause to explain each step

---

### SHOT 4: Live Demo Setup (1:30 - 1:45)
**Visual**: Switch to terminal (full screen, large font)
- Clean terminal, no distractions
- Command visible: `npm run demo`

**Voiceover**: "Let me show you this working live. I'll run an autonomous agent that makes 1000 API requests..."

**Camera**: Terminal fills screen, cursor on command

---

### SHOT 5: x402 Protocol Flow (1:45 - 2:15)
**Visual**: Terminal output scrolling
- First 402 response visible
- "Opening channel per x402 instructions"
- "Channel opened" confirmation
- Rapid successful requests

**Voiceover**: "Watch what happens. First request: 402 Payment Required with x402 instructions. The client opens a channel on-chain. Now all subsequent requests succeed using the SAME channel..."

**Camera**: Terminal, let output scroll naturally, slow down for key moments

---

### SHOT 6: Request Stream (2:15 - 2:45)
**Visual**: Terminal showing continuous successful requests
- "✅ Paid via STX subscription channel" repeating
- Counter showing request numbers
- Speed demonstrates efficiency

**Voiceover**: "Hundreds of requests... all verified through the payment channel with ZERO additional on-chain transactions. This is real - every verification checks the on-chain contract using read-only calls."

**Camera**: Terminal, medium scroll speed, show the volume

---

### SHOT 7: Smart Contract Code (2:45 - 3:05)
**Visual**: Split screen or switch to VS Code
- `subscription-channel.clar` open
- Highlight `verify-payment` function
- Show balance calculation formula

**Voiceover**: "The core magic is in our Clarity smart contract. The verify-payment function calculates remaining balance mathematically - no state writes, no gas fees."

**Camera**: Zoom in on key code sections

---

### SHOT 8: Middleware Implementation (3:05 - 3:25)
**Visual**: VS Code showing `x402-subscription.ts`
- Show 402 response generation
- Highlight x402 schema
- Show verification logic

**Voiceover**: "Our Express middleware implements the x402 protocol. 402 responses include standardized payment instructions. When clients retry with proof, we verify on-chain."

**Camera**: Scroll through key middleware code

---

### SHOT 9: On-Chain Verification (3:25 - 3:45)
**Visual**: Browser showing Stacks Explorer
- Transaction details visible
- Contract address highlighted
- Event logs showing channel open

**Voiceover**: "Here's our deployed contract on Stacks testnet. This open-channel transaction is the ONLY transaction for potentially thousands of API requests."

**Camera**: Scroll through explorer page

---

### SHOT 10: Dashboard Stats (3:45 - 4:05)
**Visual**: Back to dashboard, demo section
- Stats cards showing metrics
- Request feed with real data
- Balance meter visualization

**Voiceover**: "Our dashboard visualizes everything in real-time - channel status, live requests, and most importantly: 99.8% gas savings."

**Camera**: Smooth scroll through demo section

---

### SHOT 11: Use Cases (4:05 - 4:25)
**Visual**: Dashboard scrolling to use cases/info section
- Show different application types
- Highlight versatility

**Voiceover**: "This enables real Bitcoin-native subscriptions: SaaS platforms, autonomous AI agents, streaming content, premium data feeds, IoT devices - all without credit cards or per-request fees."

**Camera**: Slow scroll, pause on each use case

---

### SHOT 12: Closing (4:25 - 4:45)
**Visual**: Dashboard top section, then to GitHub/README
- Show repo structure
- Display README badges
- Contract address visible

**Voiceover**: "BitSubs is the first x402 implementation for continuous subscriptions. We're combining standardized payment protocols with payment channels to make Bitcoin subscriptions practical at scale. Check out the repo. Thank you!"

**Camera**: Smooth transition, end on professional note

---

## Production Notes

### Terminal Setup
```bash
# Increase font size
# Set theme to high contrast
# Clear history before recording
clear
```

### Browser Setup
- Zoom: 125%
- Hide bookmarks bar
- Close unnecessary tabs
- Disable notifications

### Timing Markers
- 0:15 - Problem stated
- 1:30 - Live demo starts
- 2:45 - Code deep-dive
- 4:25 - Closing CTA

### Backup Shots (If Time Permits)
- Test results (13/13 passing)
- Architecture diagram
- README documentation
- Contract code full walkthrough

---

## Transition Guide

**Dashboard → Terminal**: Smooth fade or cut
**Terminal → Code**: Direct cut (shows preparation)
**Code → Explorer**: Browser navigation (real workflow)
**Explorer → Dashboard**: Tab switch (keeps it real)

---

## Post-Production Checklist

- [ ] Add title card at start (optional)
- [ ] Add "GitHub: github.com/nagavaishak/BitSubs" overlay at end
- [ ] Verify all text is readable at 1080p
- [ ] Check audio levels (consistent volume)
- [ ] Add chapter markers (optional):
  - 0:00 Introduction
  - 0:15 Problem Statement
  - 0:45 Solution Architecture
  - 1:30 Live Demo
  - 2:45 Code Deep-Dive
  - 3:25 On-Chain Verification
  - 4:05 Use Cases
  - 4:25 Closing

---

## Alternative: 2-Minute Speed Run

If you need a shorter version:

1. **Hook** (15s): Dashboard + problem
2. **Demo** (60s): Terminal running agent
3. **Code** (30s): Contract + middleware
4. **Close** (15s): Use cases + repo

Total: 2:00

---

**Remember**: Energy and enthusiasm matter as much as technical accuracy. Show confidence in what you built! 🚀
