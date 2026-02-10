import { motion } from 'framer-motion'

interface Props {
  balance: number
  totalDeposit: number
}

export default function BalanceMeter({ balance, totalDeposit }: Props) {
  const percentage = (balance / totalDeposit) * 100

  return (
    <motion.div
      className="stacks-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <h3 className="section-title" style={{ marginBottom: '2rem' }}>
        Channel Balance
      </h3>

      <div style={{ padding: '1rem 0' }}>
        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: '8px',
          background: 'var(--stacks-border)',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '2rem'
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5 }}
            style={{
              height: '100%',
              background: 'var(--stacks-orange)',
              borderRadius: '4px'
            }}
          />
        </div>

        {/* Balance stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
          marginTop: '2rem'
        }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--stacks-text-secondary)', marginBottom: '0.5rem' }}>
              Current Balance
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--stacks-white)' }}>
              {(balance / 1000000).toFixed(3)} STX
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--stacks-text-secondary)', marginBottom: '0.5rem' }}>
              Remaining
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--stacks-orange)' }}>
              {percentage.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
