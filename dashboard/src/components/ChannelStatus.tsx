import { motion } from 'framer-motion'

interface Props {
  status: 'closed' | 'opening' | 'active' | 'expired' | 'closing'
}

export default function ChannelStatus({ status }: Props) {
  const statusConfig = {
    closed: { label: 'Channel Closed', badge: 'inactive' },
    opening: { label: 'Opening Channel...', badge: 'warning' },
    active: { label: 'Channel Active', badge: 'active' },
    expired: { label: 'Subscription Expired', badge: 'error' },
    closing: { label: 'Closing Channel...', badge: 'warning' }
  }

  const config = statusConfig[status]

  return (
    <motion.div
      className="stacks-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="section-title" style={{ marginBottom: '2rem' }}>
        Subscription Status
      </h3>

      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
        <div style={{ marginBottom: '2rem' }}>
          <span className={`status-badge ${config.badge}`}>
            {config.label}
          </span>
        </div>

        <div style={{ fontSize: '0.9rem', color: 'var(--stacks-text-secondary)' }}>
          {status === 'active' && 'Your subscription channel is open and accepting payments'}
          {status === 'closed' && 'No active subscription channel'}
          {status === 'opening' && 'Creating payment channel on Stacks blockchain...'}
          {status === 'expired' && 'Balance depleted - subscription access revoked'}
          {status === 'closing' && 'Settling final balances...'}
        </div>
      </div>
    </motion.div>
  )
}
