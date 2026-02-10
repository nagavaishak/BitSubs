import { motion } from 'framer-motion'

interface Props {
  balance: number
  totalDeposit: number
}

export default function BalanceMeter({ balance, totalDeposit }: Props) {
  const percentage = (balance / totalDeposit) * 100

  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <h3 style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '1.2rem',
        marginBottom: '2rem',
        color: '#00F0FF',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      }}>
        Balance Meter
      </h3>

      <div style={{ padding: '2rem 0', textAlign: 'center' }}>
        <div style={{
          position: 'relative',
          width: '200px',
          height: '200px',
          margin: '0 auto 2rem'
        }}>
          <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="20"
            />
            <motion.circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="20"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: percentage / 100 }}
              transition={{ duration: 0.5 }}
              style={{
                strokeDasharray: 565,
                strokeDashoffset: 565 * (1 - percentage / 100)
              }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#5546FF' }} />
                <stop offset="100%" style={{ stopColor: '#F7931A' }} />
              </linearGradient>
            </defs>
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <div style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '2rem',
              fontWeight: 'bold',
              color: percentage > 50 ? '#39FF14' : percentage > 20 ? '#F7931A' : '#ff4444',
              textShadow: `0 0 20px ${percentage > 50 ? '#39FF14' : percentage > 20 ? '#F7931A' : '#ff4444'}`
            }}>
              {percentage.toFixed(0)}%
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          fontSize: '0.9rem',
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          <div>
            <div style={{ color: '#888', marginBottom: '0.5rem' }}>Balance</div>
            <div style={{ color: '#F7931A', fontWeight: 'bold' }}>
              {(balance / 1000000).toFixed(6)} STX
            </div>
          </div>
          <div>
            <div style={{ color: '#888', marginBottom: '0.5rem' }}>Deposit</div>
            <div style={{ color: '#5546FF', fontWeight: 'bold' }}>
              {(totalDeposit / 1000000).toFixed(6)} STX
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
