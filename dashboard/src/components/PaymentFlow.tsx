import { motion } from 'framer-motion'

interface Props {
  status: 'closed' | 'opening' | 'active' | 'expired' | 'closing'
}

export default function PaymentFlow({ status }: Props) {
  const steps = [
    { id: 1, label: 'Open Channel', icon: '🔓', active: ['opening', 'active', 'expired', 'closing'] },
    { id: 2, label: 'Stream Payments', icon: '⚡', active: ['active', 'expired', 'closing'] },
    { id: 3, label: 'Auto-Expire', icon: '⏱️', active: ['expired', 'closing'] },
    { id: 4, label: 'Close & Settle', icon: '🔒', active: ['closing'] }
  ]

  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h3 style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '1.2rem',
        marginBottom: '2rem',
        color: '#00F0FF',
        textTransform: 'uppercase',
        letterSpacing: '2px',
        textAlign: 'center'
      }}>
        Payment Flow
      </h3>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        padding: '2rem 0'
      }}>
        {/* Connection line */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '10%',
          right: '10%',
          height: '2px',
          background: 'linear-gradient(90deg, rgba(85,70,255,0.3), rgba(247,147,26,0.3))',
          zIndex: 0
        }} />

        {steps.map((step, index) => {
          const isActive = step.active.includes(status)

          return (
            <div key={step.id} style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <motion.div
                animate={{
                  scale: isActive ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 1.5,
                  repeat: isActive ? Infinity : 0
                }}
                style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto',
                  borderRadius: '50%',
                  background: isActive
                    ? 'linear-gradient(135deg, #F7931A, #5546FF)'
                    : 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  boxShadow: isActive ? '0 0 30px rgba(247,147,26,0.6)' : 'none',
                  border: `2px solid ${isActive ? '#F7931A' : '#333'}`,
                  marginBottom: '1rem'
                }}
              >
                {step.icon}
              </motion.div>
              <div style={{
                textAlign: 'center',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.9rem',
                color: isActive ? '#F7931A' : '#666',
                fontWeight: isActive ? 'bold' : 'normal'
              }}>
                {step.label}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
