import { useState } from 'react'
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
      <Header />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="section"
        style={{ textAlign: 'center' }}
      >
        <button
          className="stacks-button"
          onClick={startDemo}
          disabled={demoState.isRunning}
        >
          {demoState.isRunning ? 'Demo Running...' : 'Start Live Demo'}
        </button>
      </motion.div>

      <div className="section grid-2">
        <ChannelStatus status={demoState.channelStatus} />
        <BalanceMeter
          balance={demoState.balance}
          totalDeposit={demoState.totalDeposit}
        />
      </div>

      <div className="section">
        <PaymentFlow status={demoState.channelStatus} />
      </div>

      <div className="section">
        <StatsCards stats={demoState.stats} />
      </div>

      <div className="section grid-2">
        <RequestFeed requests={demoState.requests} />
        <BlockchainInfo blockchain={demoState.blockchain} />
      </div>
    </div>
  )
}

export default App
