import { motion } from 'framer-motion'

interface Props {
  status: 'closed' | 'opening' | 'active' | 'expired' | 'closing'
}

export default function ChannelStatus({ status }: Props) {
  const statusConfig = {
    closed: { label: 'CHANNEL CLOSED', color: '#666', glow: false },
    opening: { label: 'OPENING CHANNEL', color: '#F7931A', glow: true },
    active: { label: 'CHANNEL ACTIVE', color: '#39FF14', glow: true },
    expired: { label: 'SUBSCRIPTION EXPIRED', color: '#ff4444', glow: true },
    closing: { label: 'CLOSING CHANNEL', color: '#F7931A', glow: true }
  }

  const config = statusConfig[status]

  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h3 style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '1.2rem',
        marginBottom: '2rem',
        color: '#00F0FF',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      }}>
        Channel Status
      </h3>

      <div style={{
        textAlign: 'center',
        padding: '3rem 0'
      }}>
        <motion.div
          animate={{
            scale: config.glow ? [1, 1.1, 1] : 1,
          }}
          transition={{
            duration: 2,
            repeat: config.glow ? Infinity : 0
          }}
          style={{
            width: '120px',
            height: '120px',
            margin: '0 auto',
            borderRadius: '50%',
            background: config.color,
            boxShadow: config.glow ? `0 0 40px ${config.color}, 0 0 80px ${config.color}` : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            marginBottom: '2rem'
          }}
        >
          {status === 'active' && '✓'}
          {status === 'expired' && '✕'}
          {status === 'opening' && '↗'}
          {status === 'closing' && '↙'}
          {status === 'closed' && '○'}
        </motion.div>

        <h2 style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '1.5rem',
          color: config.color,
          textShadow: config.glow ? `0 0 20px ${config.color}` : 'none',
          letterSpacing: '3px'
        }}>
          {config.label}
        </h2>
      </div>
    </motion.div>
  )
}
