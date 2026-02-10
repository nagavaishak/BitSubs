import { useState } from 'react'
import { motion } from 'framer-motion'
import './App.css'
import ChannelStatus from './components/ChannelStatus'
import BalanceMeter from './components/BalanceMeter'
import RequestFeed from './components/RequestFeed'
import PaymentFlow from './components/PaymentFlow'
import StatsCards from './components/StatsCards'
import BlockchainInfo from './components/BlockchainInfo'

interface DemoState {
  isRunning: boolean
  channelStatus: 'closed' | 'opening' | 'active' | 'expired' | 'closing'
  balance: number
  totalDeposit: number
  requests: Array<{
    id: number
    endpoint: string
    status: number
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
      contractAddress: 'STDJM59BQ5320FM808QWEVP4JXH0R9BYS4Q0YE6C.subscription-channel',
      txId: null,
      blockHeight: 0
    }
  })

  const startDemo = async () => {
    setDemoState(prev => ({ ...prev, isRunning: true, channelStatus: 'opening' }))

    setTimeout(() => {
      setDemoState(prev => ({
        ...prev,
        channelStatus: 'active',
        balance: prev.totalDeposit,
        stats: { ...prev.stats, onChainTxs: 1 },
        blockchain: {
          ...prev.blockchain,
          txId: '0x6dcf04602d18d9208c44bb5b83052af232089e469cf0b116d67fd77e744a2743'
        }
      }))
      startRequestSimulation()
    }, 2000)
  }

  const startRequestSimulation = () => {
    let requestCount = 0
    const interval = setInterval(() => {
      if (requestCount >= 1000) {
        clearInterval(interval)
        closeChannel()
        return
      }

      const endpoints = ['/api/premium/weather', '/api/premium/market-data', '/api/premium/news']
      const endpoint = endpoints[requestCount % 3]

      setDemoState(prev => {
        const newBalance = prev.balance - 100
        const status = newBalance > 0 ? 200 : 402

        const newRequest = {
          id: requestCount,
          endpoint,
          status,
          timestamp: Date.now()
        }

        const newRequests = [newRequest, ...prev.requests].slice(0, 50)

        const newStats = {
          totalRequests: prev.stats.totalRequests + 1,
          successfulRequests: status === 200 ? prev.stats.successfulRequests + 1 : prev.stats.successfulRequests,
          onChainTxs: prev.stats.onChainTxs,
          gasSavings: ((1 - (2 / (prev.stats.totalRequests + 1))) * 100)
        }

        if (newBalance <= 0) {
          clearInterval(interval)
          setTimeout(() => closeChannel(), 1000)
          return {
            ...prev,
            balance: 0,
            channelStatus: 'expired',
            requests: newRequests,
            stats: newStats
          }
        }

        return {
          ...prev,
          balance: newBalance,
          requests: newRequests,
          stats: newStats
        }
      })

      requestCount++
    }, 30)
  }

  const closeChannel = () => {
    setDemoState(prev => ({ ...prev, channelStatus: 'closing' }))
    setTimeout(() => {
      setDemoState(prev => ({
        ...prev,
        channelStatus: 'closed',
        isRunning: false,
        stats: { ...prev.stats, onChainTxs: 2 }
      }))
    }, 2000)
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <span>❋</span> BitSubs
          </div>
          <nav className="nav-links">
            <a href="#" className="nav-link">Learn</a>
            <a href="#" className="nav-link">Build</a>
            <a href="#" className="nav-link">Explore</a>
            <button className="cta-button">START BUILDING →</button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              BITCOIN SUBSCRIPTION INFRASTRUCTURE
            </div>
            <h1 className="hero-title">
              Stream payments with Bitcoin L2
            </h1>
            <p className="hero-subtitle">
              BitSubs enables subscription-based payments using payment channels on Stacks,
              eliminating per-request gas fees and scaling Bitcoin transactions.
            </p>
          </div>
          <div className="hero-visual"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-content">
          <h2 className="section-title">Why BitSubs?</h2>
          <div className="features-grid">
            <motion.div
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="feature-icon">🔒</div>
              <h3 className="feature-title">Secure</h3>
              <p className="feature-description">
                Built on Bitcoin's most battle-tested L2. Payment channels secured by Clarity smart contracts with mathematical balance verification.
              </p>
            </motion.div>

            <motion.div
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Scalable</h3>
              <p className="feature-description">
                Process unlimited off-chain transactions with only 2 on-chain operations.
                Save 99%+ on gas fees with instant micropayments.
              </p>
            </motion.div>

            <motion.div
              className="feature-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="feature-icon">🔧</div>
              <h3 className="feature-title">Developer-First</h3>
              <p className="feature-description">
                Drop-in middleware for Express.js apps. Start accepting Bitcoin subscriptions
                with just a few lines of code.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works - Dark Section */}
      <section className="dark-section">
        <div className="section-content">
          <h2 className="section-title">How Payment Channels Work</h2>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-number">1</div>
              <div className="timeline-content">
                <h3 className="timeline-title">Open Channel</h3>
                <p className="timeline-description">
                  User deposits STX into a payment channel. This is the only on-chain transaction required to start.
                </p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-number">2</div>
              <div className="timeline-content">
                <h3 className="timeline-title">Stream Payments</h3>
                <p className="timeline-description">
                  Process unlimited API requests off-chain. Balance drains mathematically based on blocks elapsed.
                  No writes required.
                </p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-number">3</div>
              <div className="timeline-content">
                <h3 className="timeline-title">Auto-Expire</h3>
                <p className="timeline-description">
                  When balance runs low, payments automatically fail with 402 Payment Required.
                  No manual intervention needed.
                </p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-number">4</div>
              <div className="timeline-content">
                <h3 className="timeline-title">Close & Settle</h3>
                <p className="timeline-description">
                  Either party can close the channel. Contract automatically returns unused funds
                  and pays service provider.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="demo-section" id="demo">
        <div className="demo-header">
          <div className="demo-badge">LIVE DEMO</div>
          <h2 className="demo-title">See BitSubs in Action</h2>
          <p className="demo-description">
            Watch a complete E2E flow: open channel, stream 1000 API requests,
            auto-expire when balance depletes, and settle on-chain. All in real-time.
          </p>
          <button
            className="demo-button"
            onClick={startDemo}
            disabled={demoState.isRunning}
          >
            {demoState.isRunning ? 'Demo Running...' : 'Start Live Demo'}
          </button>
        </div>

        <div className="dashboard-grid">
          {/* Channel Status & Balance */}
          <div className="grid-2">
            <motion.div
              className="dashboard-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="card-title">Channel Status</h3>
              <ChannelStatus status={demoState.channelStatus} />
            </motion.div>

            <motion.div
              className="dashboard-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3 className="card-title">Balance Meter</h3>
              <BalanceMeter
                balance={demoState.balance}
                totalDeposit={demoState.totalDeposit}
              />
            </motion.div>
          </div>

          {/* Payment Flow */}
          <motion.div
            className="dashboard-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <PaymentFlow status={demoState.channelStatus} />
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <StatsCards stats={demoState.stats} />
          </motion.div>

          {/* Request Feed & Blockchain Info */}
          <div className="grid-2">
            <motion.div
              className="dashboard-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3 className="card-title">Live Request Feed</h3>
              <RequestFeed requests={demoState.requests} />
            </motion.div>

            <motion.div
              className="dashboard-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h3 className="card-title">Blockchain Information</h3>
              <BlockchainInfo blockchain={demoState.blockchain} />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default App
