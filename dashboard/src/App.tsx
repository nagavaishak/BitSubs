import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import './App.css'
import Header from './components/Header'
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

    // Simulate opening channel
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
    }, 3000)
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
        const newBalance = prev.balance - 100 // 100 microSTX per block
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
          setTimeout(() => closeChannel(), 2000)
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
    }, 50) // Fast simulation: 50ms per request
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
    <>
      <div className="grid-background" />
      <div className="scanline" />

      <div className="app-container">
        <Header />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: '3rem', textAlign: 'center' }}
        >
          <button
            className="neon-button"
            onClick={startDemo}
            disabled={demoState.isRunning}
            style={{
              opacity: demoState.isRunning ? 0.5 : 1,
              cursor: demoState.isRunning ? 'not-allowed' : 'pointer'
            }}
          >
            {demoState.isRunning ? 'Demo Running...' : 'Start Demo'}
          </button>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          <ChannelStatus status={demoState.channelStatus} />
          <BalanceMeter
            balance={demoState.balance}
            totalDeposit={demoState.totalDeposit}
          />
        </div>

        <PaymentFlow status={demoState.channelStatus} />

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
          marginTop: '2rem'
        }}>
          <RequestFeed requests={demoState.requests} />
          <div>
            <StatsCards stats={demoState.stats} />
            <BlockchainInfo blockchain={demoState.blockchain} />
          </div>
        </div>
      </div>
    </>
  )
}

export default App
