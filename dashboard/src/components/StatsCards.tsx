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
    { label: 'Total Requests', value: stats.totalRequests.toLocaleString() },
    { label: 'Successful', value: stats.successfulRequests.toLocaleString() },
    { label: 'On-Chain Transactions', value: stats.onChainTxs },
    { label: 'Gas Savings', value: `${stats.gasSavings.toFixed(2)}%` }
  ]

  return (
    <div className="grid-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          className="stacks-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: 'var(--stacks-orange)',
            marginBottom: '0.5rem'
          }}>
            {card.value}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--stacks-text-secondary)',
            fontWeight: 500
          }}>
            {card.label}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
