import { motion } from 'framer-motion'

export default function Docs() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '4rem 2rem',
        color: 'var(--stacks-white)'
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 800,
          marginBottom: '1rem',
          color: 'var(--stacks-orange)'
        }}>
          Documentation
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: 'var(--stacks-text-secondary)'
        }}>
          Learn how to use BitSubs for Bitcoin subscriptions
        </p>
      </div>

      {/* Quick Start */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--stacks-orange)', paddingBottom: '0.5rem' }}>
          Quick Start
        </h2>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--stacks-border)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--stacks-orange)' }}>1. Try the Live API</h3>
          <p style={{ marginBottom: '1rem' }}>Test our x402-compliant subscription API:</p>
          <pre style={{
            background: '#000',
            padding: '1.5rem',
            borderRadius: '4px',
            overflow: 'x-auto',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            border: '1px solid var(--stacks-orange)'
          }}>
{`curl https://bitsubs-production.up.railway.app/api/premium/weather`}
          </pre>
          <p style={{ marginTop: '1rem', color: 'var(--stacks-text-secondary)' }}>
            ↳ Returns 402 Payment Required with x402 payment instructions
          </p>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--stacks-border)', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--stacks-orange)' }}>2. Open Subscription Channel</h3>
          <p style={{ marginBottom: '1rem' }}>Deposit STX into payment channel (1 on-chain transaction):</p>
          <pre style={{
            background: '#000',
            padding: '1.5rem',
            borderRadius: '4px',
            overflow: 'x-auto',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            border: '1px solid var(--stacks-orange)'
          }}>
{`// Using Stacks.js
import { openContractCall } from '@stacks/connect';

await openContractCall({
  contractAddress: 'STDJM59BQ5320FM808QWEVP4JXH0R9BYS4Q0YE6C',
  contractName: 'subscription-channel',
  functionName: 'open-channel',
  functionArgs: [
    principalCV('SERVICE_ADDRESS'),
    uintCV(1000000),  // 1 STX deposit
    uintCV(100)       // Rate per block
  ]
});`}
          </pre>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--stacks-border)' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--stacks-orange)' }}>3. Make Requests</h3>
          <p style={{ marginBottom: '1rem' }}>Access protected endpoints with payment proof:</p>
          <pre style={{
            background: '#000',
            padding: '1.5rem',
            borderRadius: '4px',
            overflow: 'x-auto',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            border: '1px solid var(--stacks-orange)'
          }}>
{`curl -H "x-payment-proof: <signature>" \\
     -H "x-stacks-address: <your-address>" \\
     https://bitsubs-production.up.railway.app/api/premium/weather`}
          </pre>
          <p style={{ marginTop: '1rem', color: 'var(--stacks-text-secondary)' }}>
            ↳ Returns data while channel balance {'>'} 0
          </p>
        </div>
      </section>

      {/* For Developers */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--stacks-orange)', paddingBottom: '0.5rem' }}>
          For Developers
        </h2>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--stacks-border)' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--stacks-orange)' }}>Protect Your API (3 lines)</h3>
          <pre style={{
            background: '#000',
            padding: '1.5rem',
            borderRadius: '4px',
            overflow: 'x-auto',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            border: '1px solid var(--stacks-orange)'
          }}>
{`import { x402SubscriptionMiddleware } from '@bitsubs/middleware';

app.use('/api/premium/*', x402SubscriptionMiddleware({
  contractAddress: 'STDJM59BQ5320FM808QWEVP4JXH0R9BYS4Q0YE6C',
  contractName: 'subscription-channel',
  serviceAddress: 'YOUR_STACKS_ADDRESS',
  network: 'testnet'
}));

// That's it! Your API now accepts Bitcoin subscriptions`}
          </pre>
        </div>
      </section>

      {/* Live Endpoints */}
      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--stacks-orange)', paddingBottom: '0.5rem' }}>
          Live Endpoints
        </h2>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--stacks-border)' }}>
            <code style={{ color: 'var(--stacks-orange)', fontSize: '1.1rem' }}>GET /health</code>
            <p style={{ marginTop: '0.5rem', color: 'var(--stacks-text-secondary)' }}>Health check endpoint</p>
            <a href="https://bitsubs-production.up.railway.app/health" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--stacks-orange)', textDecoration: 'underline' }}>
              Try it →
            </a>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--stacks-border)' }}>
            <code style={{ color: 'var(--stacks-orange)', fontSize: '1.1rem' }}>GET /api/premium/weather</code>
            <p style={{ marginTop: '0.5rem', color: 'var(--stacks-text-secondary)' }}>Protected weather data (requires subscription)</p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--stacks-border)' }}>
            <code style={{ color: 'var(--stacks-orange)', fontSize: '1.1rem' }}>GET /api/premium/market-data</code>
            <p style={{ marginTop: '0.5rem', color: 'var(--stacks-text-secondary)' }}>Protected market data (requires subscription)</p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--stacks-border)' }}>
            <code style={{ color: 'var(--stacks-orange)', fontSize: '1.1rem' }}>GET /api/premium/news</code>
            <p style={{ marginTop: '0.5rem', color: 'var(--stacks-text-secondary)' }}>Protected news headlines (requires subscription)</p>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section>
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--stacks-orange)', paddingBottom: '0.5rem' }}>
          Why BitSubs?
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--stacks-border)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
            <h3 style={{ color: 'var(--stacks-orange)', marginBottom: '0.5rem' }}>99.8% Gas Reduction</h3>
            <p style={{ color: 'var(--stacks-text-secondary)' }}>1000 requests = 2 transactions</p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--stacks-border)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>₿</div>
            <h3 style={{ color: 'var(--stacks-orange)', marginBottom: '0.5rem' }}>Bitcoin-Native</h3>
            <p style={{ color: 'var(--stacks-text-secondary)' }}>STX & sBTC on Stacks L2</p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--stacks-border)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔐</div>
            <h3 style={{ color: 'var(--stacks-orange)', marginBottom: '0.5rem' }}>x402 Compliant</h3>
            <p style={{ color: 'var(--stacks-text-secondary)' }}>Full protocol implementation</p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--stacks-border)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔓</div>
            <h3 style={{ color: 'var(--stacks-orange)', marginBottom: '0.5rem' }}>Permissionless</h3>
            <p style={{ color: 'var(--stacks-text-secondary)' }}>No accounts, no API keys</p>
          </div>
        </div>
      </section>

      {/* Links */}
      <section style={{ marginTop: '4rem', padding: '2rem', background: 'rgba(255,114,0,0.1)', borderRadius: '8px', border: '1px solid var(--stacks-orange)' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Resources</h3>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <a href="https://github.com/nagavaishak/BitSubs" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--stacks-orange)', textDecoration: 'underline' }}>
            GitHub Repository →
          </a>
          <a href="https://bitsubs-production.up.railway.app" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--stacks-orange)', textDecoration: 'underline' }}>
            Live API →
          </a>
          <a href="https://explorer.hiro.so/txid/6dcf04602d18d9208c44bb5b83052af232089e469cf0b116d67fd77e744a2743?chain=testnet" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--stacks-orange)', textDecoration: 'underline' }}>
            Contract Explorer →
          </a>
        </div>
      </section>
    </motion.div>
  )
}
