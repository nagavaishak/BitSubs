import { motion } from 'framer-motion'

interface Props {
  stats: {
    totalRequests: number
    successfulRequests: number
    onChainTxs: number
    gasSavings: number
  }
}

export default function StatsCards({ stats }: Props) {
  const cards = [
    {
      label: 'Total Requests',
      value: stats.totalRequests.toLocaleString(),
      color: '#00F0FF',
      icon: '📊'
    },
    {
      label: 'Successful',
      value: stats.successfulRequests.toLocaleString(),
      color: '#39FF14',
      icon: '✓'
    },
    {
      label: 'On-Chain Txs',
      value: stats.onChainTxs,
      color: '#F7931A',
      icon: '⛓️'
    },
    {
      label: 'Gas Savings',
      value: `${stats.gasSavings.toFixed(2)}%`,
      color: '#5546FF',
      icon: '⚡'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}
    >
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          className="glass-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
          style={{
            padding: '1.5rem',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{card.icon}</div>
          <div style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '1.8rem',
            fontWeight: 'bold',
            color: card.color,
            textShadow: `0 0 10px ${card.color}`,
            marginBottom: '0.5rem'
          }}>
            {card.value}
          </div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.8rem',
            color: '#888',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            {card.label}
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
