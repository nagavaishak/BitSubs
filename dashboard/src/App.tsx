import { useState } from 'react'
import { motion } from 'framer-motion'
import './App.css'
import ChannelStatus from './components/ChannelStatus'
import BalanceMeter from './components/BalanceMeter'
import RequestFeed from './components/RequestFeed'
import PaymentFlow from './components/PaymentFlow'
import StatsCards from './components/StatsCards'
import BlockchainInfo from './components/BlockchainInfo'
import Docs from './components/Docs'

interface DemoState {
  isRunning: boolean
  channelStatus: 'closed' | 'opening' | 'active' | 'expired' | 'closing'
  balance: number
  totalDeposit: number
  requests: Array<{
    id: number
    endpoint: string
    status: 'pending' | 'success' | 'error' | number
    timestamp: number
  }>
  stats: {
    totalRequests: number
    successfulRequests: number
    onChainTxs: number
    gasSavings: number
  }
  blockchain: {
    contractAddress: string
    txId: string | null
    blockHeight: number
  }
}

function App() {
  const [currentPage, setCurrentPage] = useState<'demo' | 'docs'>('demo')
  const [demoState, setDemoState] = useState<DemoState>({
    isRunning: false,
    channelStatus: 'closed',
    balance: 0,
    totalDeposit: 1000000,
    requests: [],
    stats: {
      totalRequests: 0,
      successfulRequests: 0,
      onChainTxs: 0,
      gasSavings: 0
    },
    blockchain: {
      contractAddress: 'ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP.subscription-channel-v2',
      txId: null,
      blockHeight: 0
    }
  })

  const startDemo = async () => {
    setDemoState(prev => ({ ...prev, isRunning: true, channelStatus: 'opening', requests: [] }))

    try {
      const API_URL = 'https://bitsubs-production.up.railway.app'

      // Step 1: Request without payment proof → 402
      addRequest('Initial request (no payment proof)', 'pending')
      const r1 = await fetch(`${API_URL}/api/premium/weather`)

      if (r1.status === 402) {
        addRequest('402 Payment Required received', 'success')
        await sleep(1000)

        // Step 2: Channel pre-opened
        setDemoState(prev => ({
          ...prev,
          channelStatus: 'active',
          balance: prev.totalDeposit,
          stats: { ...prev.stats, onChainTxs: 1 }
        }))
        addRequest('Channel already open (demo wallet)', 'success')
        await sleep(1000)

        // Step 3: Generate signature
        addRequest('Generating payment proof signature...', 'pending')
        const sigRes = await fetch(`${API_URL}/api/demo/sign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resource: '/api/premium/weather' })
        })
        const { signature, address } = await sigRes.json()
        addRequest(`Signature generated for ${address.slice(0, 10)}...`, 'success')
        await sleep(1000)

        // Step 4: Retry with payment proof → 200
        addRequest('Retrying with payment proof headers...', 'pending')
        const r2 = await fetch(`${API_URL}/api/premium/weather`, {
          headers: {
            'x-payment-proof': signature,
            'x-stacks-address': address
          }
        })

        if (r2.status === 200) {
          const data = await r2.json()
          addRequest('✅ Access granted - 200 OK', 'success')
          addRequest(`Weather data: ${data.temperature}°F ${data.condition}`, 'success')

          setDemoState(prev => ({
            ...prev,
            stats: {
              ...prev.stats,
              totalRequests: 1,
              successfulRequests: 1,
              gasSavings: 99.8
            }
          }))
        } else {
          addRequest(`❌ Verification failed: ${r2.status}`, 'error')
        }
      }
    } catch (error: any) {
      addRequest(`❌ Error: ${error.message}`, 'error')
    } finally {
      setDemoState(prev => ({ ...prev, isRunning: false }))
    }
  }

  const addRequest = (message: string, status: 'pending' | 'success' | 'error') => {
    setDemoState(prev => ({
      ...prev,
      requests: [...prev.requests, {
        id: Date.now(),
        endpoint: message,
        status,
        timestamp: Date.now()
      }]
    }))
  }

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

  return (
    <div className="app-container">
      {/* Noise texture overlay */}
      <div className="noise-overlay"></div>

      {/* Grid background */}
      <div className="grid-bg"></div>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-bracket">[</span>
            <span className="logo-text">BitSubs</span>
            <span className="logo-bracket">]</span>
          </div>
          <nav className="nav-links">
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('docs'); }} className="nav-link">/docs</a>
            <a href="https://github.com/nagavaishak/BitSubs" target="_blank" rel="noopener noreferrer" className="nav-link">/github</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('demo'); }} className="nav-link">/demo</a>
            <a href="https://bitsubs-production.up.railway.app" target="_blank" rel="noopener noreferrer" className="cta-button">
              <span className="btn-arrow">→</span> API
            </a>
          </nav>
        </div>
      </header>

      {currentPage === 'docs' ? (
        <Docs />
      ) : (
        <>
      {/* Hero Section */}
      <section className="hero-section">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="hero-left">
            <div className="hero-badge-container">
              <span className="badge-prefix">// </span>
              <span className="hero-badge">x402-protocol</span>
              <span className="badge-blink">_</span>
            </div>

            <motion.h1
              className="hero-title"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              BITCOIN
              <br />
              <span className="title-outline">SUBSCRIPTIONS</span>
              <br />
              <span className="title-accent">WITHOUT GAS</span>
            </motion.h1>

            <motion.div
              className="hero-stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="stat-item">
                <div className="stat-value">99.8%</div>
                <div className="stat-label">gas reduction</div>
              </div>
              <div className="stat-divider">/</div>
              <div className="stat-item">
                <div className="stat-value">2 txs</div>
                <div className="stat-label">per 1000 requests</div>
              </div>
              <div className="stat-divider">/</div>
              <div className="stat-item">
                <div className="stat-value">FIRST</div>
                <div className="stat-label">continuous x402</div>
              </div>
            </motion.div>

            <motion.p
              className="hero-description"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Payment channels on Stacks. x402 protocol compliance.
              <br />
              Open once. Stream forever. Settle on-chain.
            </motion.p>

            <motion.div
              className="hero-cta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <a href="#demo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: document.getElementById('demo')?.offsetTop || 0, behavior: 'smooth' }); }} className="hero-button primary">
                RUN DEMO →
              </a>
              <a href="https://github.com/nagavaishak/BitSubs" target="_blank" rel="noopener noreferrer" className="hero-button secondary">
                VIEW SOURCE
              </a>
            </motion.div>
          </div>

          <div className="hero-right">
            <motion.div
              className="hero-terminal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="terminal-header">
                <span className="terminal-dot red"></span>
                <span className="terminal-dot yellow"></span>
                <span className="terminal-dot green"></span>
                <span className="terminal-title">x402-flow.log</span>
              </div>
              <div className="terminal-body">
                <div className="terminal-line">
                  <span className="line-number">001</span>
                  <span className="line-text">
                    <span className="text-orange">GET</span> /api/premium/data
                  </span>
                </div>
                <div className="terminal-line">
                  <span className="line-number">002</span>
                  <span className="line-text">
                    <span className="text-red">← 402</span> Payment Required
                  </span>
                </div>
                <div className="terminal-line">
                  <span className="line-number">003</span>
                  <span className="line-text">
                    <span className="text-dim">{"x402: {"}</span>
                  </span>
                </div>
                <div className="terminal-line indent">
                  <span className="line-number">004</span>
                  <span className="line-text">
                    <span className="text-dim">  contractAddress: "ST..."</span>
                  </span>
                </div>
                <div className="terminal-line indent">
                  <span className="line-number">005</span>
                  <span className="line-text">
                    <span className="text-dim">  amount: "1000000"</span>
                  </span>
                </div>
                <div className="terminal-line">
                  <span className="line-number">006</span>
                  <span className="line-text">
                    <span className="text-dim">{"}"}</span>
                  </span>
                </div>
                <div className="terminal-line">
                  <span className="line-number">007</span>
                  <span className="line-text">
                    <span className="text-orange">OPENING</span> channel...
                  </span>
                </div>
                <div className="terminal-line">
                  <span className="line-number">008</span>
                  <span className="line-text">
                    <span className="text-green">✓</span> Channel opened
                  </span>
                </div>
                <div className="terminal-line">
                  <span className="line-number">009</span>
                  <span className="line-text">
                    <span className="text-orange">RETRY</span> with proof
                  </span>
                </div>
                <div className="terminal-line">
                  <span className="line-number">010</span>
                  <span className="line-text">
                    <span className="text-green">← 200</span> OK (verified on-chain)
                  </span>
                </div>
                <div className="terminal-line">
                  <span className="line-number">011</span>
                  <span className="line-text blink">
                    <span className="text-dim">█</span>
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Protocol Flow Section */}
      <section className="protocol-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="title-number">[01]</span> X402 PROTOCOL FLOW
          </h2>
        </div>

        <div className="protocol-grid">
          <motion.div
            className="protocol-step"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="step-header">
              <span className="step-number">402</span>
              <span className="step-arrow">→</span>
            </div>
            <h3 className="step-title">PAYMENT_REQUIRED</h3>
            <p className="step-description">
              Server returns HTTP 402 with x402 instructions.
              Contract address, amount, function args.
            </p>
            <div className="step-code">
              status: <span className="code-value">402</span>
              <br />
              x402.version: <span className="code-value">1</span>
            </div>
          </motion.div>

          <motion.div
            className="protocol-step"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="step-header">
              <span className="step-number">TX</span>
              <span className="step-arrow">→</span>
            </div>
            <h3 className="step-title">OPEN_CHANNEL</h3>
            <p className="step-description">
              Client broadcasts open-channel transaction.
              Deposits STX. On-chain state created.
            </p>
            <div className="step-code">
              deposit: <span className="code-value">1000000 µSTX</span>
              <br />
              rate: <span className="code-value">100 µSTX/block</span>
            </div>
          </motion.div>

          <motion.div
            className="protocol-step"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="step-header">
              <span className="step-number">∞</span>
              <span className="step-arrow">→</span>
            </div>
            <h3 className="step-title">STREAM_VERIFY</h3>
            <p className="step-description">
              Unlimited requests. Read-only verification.
              Balance drains mathematically per block.
            </p>
            <div className="step-code">
              gas_cost: <span className="code-value">0 STX</span>
              <br />
              writes: <span className="code-value">0</span>
            </div>
          </motion.div>

          <motion.div
            className="protocol-step"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="step-header">
              <span className="step-number">TX</span>
              <span className="step-arrow">✓</span>
            </div>
            <h3 className="step-title">CLOSE_SETTLE</h3>
            <p className="step-description">
              Either party closes. Unused funds returned.
              Service paid for consumed blocks.
            </p>
            <div className="step-code">
              total_txs: <span className="code-value">2</span>
              <br />
              savings: <span className="code-value">99.8%</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Section */}
      <section className="why-section">
        <div className="why-content">
          <div className="why-left">
            <h2 className="section-title">
              <span className="title-number">[02]</span> WHY THIS MATTERS
            </h2>
            <div className="comparison-box">
              <div className="comparison-item bad">
                <div className="comparison-label">TRADITIONAL x402</div>
                <div className="comparison-value">1000 requests</div>
                <div className="comparison-arrow">↓</div>
                <div className="comparison-result">1000 transactions</div>
                <div className="comparison-cost">$$$$ gas fees</div>
              </div>
              <div className="comparison-divider">VS</div>
              <div className="comparison-item good">
                <div className="comparison-label">BITSUBS x402</div>
                <div className="comparison-value">1000 requests</div>
                <div className="comparison-arrow">↓</div>
                <div className="comparison-result">2 transactions</div>
                <div className="comparison-cost">99.8% reduction</div>
              </div>
            </div>
          </div>
          <div className="why-right">
            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <div className="feature-content">
                  <div className="feature-title">Standards compliant</div>
                  <div className="feature-text">Full x402 protocol implementation</div>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <div className="feature-content">
                  <div className="feature-title">Bitcoin-native</div>
                  <div className="feature-text">Built on Stacks L2, secured by BTC</div>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <div className="feature-content">
                  <div className="feature-title">Production-ready</div>
                  <div className="feature-text">Deployed contract, tested SDK</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="demo-section" id="demo">
        <div className="demo-header">
          <h2 className="section-title">
            <span className="title-number">[03]</span> LIVE DEMO
          </h2>
          <p className="demo-subtitle">
            Watch 1000 x402-verified requests stream through a single payment channel
          </p>
          <button
            className="demo-button"
            onClick={startDemo}
            disabled={demoState.isRunning}
          >
            <span className="btn-bracket">[</span>
            {demoState.isRunning ? 'RUNNING...' : 'START DEMO'}
            <span className="btn-bracket">]</span>
          </button>
        </div>

        <div className="dashboard-grid">
          {/* Channel Status & Balance */}
          <div className="grid-row-2">
            <motion.div
              className="dashboard-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="card-title">&gt; channel_status</h3>
              <ChannelStatus status={demoState.channelStatus} />
            </motion.div>

            <motion.div
              className="dashboard-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3 className="card-title">&gt; balance_meter</h3>
              <BalanceMeter
                balance={demoState.balance}
                totalDeposit={demoState.totalDeposit}
              />
            </motion.div>
          </div>

          {/* Payment Flow */}
          <motion.div
            className="dashboard-card full-width"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="card-title">&gt; payment_flow</h3>
            <PaymentFlow status={demoState.channelStatus} />
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            className="full-width"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <StatsCards stats={demoState.stats} />
          </motion.div>

          {/* Request Feed & Blockchain Info */}
          <div className="grid-row-2">
            <motion.div
              className="dashboard-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3 className="card-title">&gt; request_feed</h3>
              <RequestFeed requests={demoState.requests} />
            </motion.div>

            <motion.div
              className="dashboard-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h3 className="card-title">&gt; blockchain_info</h3>
              <BlockchainInfo blockchain={demoState.blockchain} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-left">
            <div className="footer-logo">
              [BitSubs] x402 Payment Channels on Stacks
            </div>
            <div className="footer-contract">
              Contract: ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP.subscription-channel-v2
            </div>
          </div>
          <div className="footer-right">
            <a href="https://github.com/nagavaishak/BitSubs" target="_blank" rel="noopener noreferrer" className="footer-link">/github</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('docs'); }} className="footer-link">/docs</a>
            <a href="https://explorer.hiro.so/txid/6dcf04602d18d9208c44bb5b83052af232089e469cf0b116d67fd77e744a2743?chain=testnet" target="_blank" rel="noopener noreferrer" className="footer-link">/explorer</a>
          </div>
        </div>
      </footer>
        </>
      )}
    </div>
  )
}

export default App
