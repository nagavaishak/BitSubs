import { motion } from 'framer-motion'

interface Props {
  status: 'closed' | 'opening' | 'active' | 'expired' | 'closing'
}

export default function PaymentFlow({ status }: Props) {
  const steps = [
    { id: 1, label: 'Open Channel', active: ['opening', 'active', 'expired', 'closing'] },
    { id: 2, label: 'Stream Payments', active: ['active', 'expired', 'closing'] },
    { id: 3, label: 'Auto-Expire', active: ['expired', 'closing'] },
    { id: 4, label: 'Close & Settle', active: ['closing'] }
  ]

  return (
    <motion.div
      className="stacks-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h3 className="section-title" style={{ textAlign: 'center', marginBottom: '3rem' }}>
        Payment Channel Lifecycle
      </h3>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        maxWidth: '900px',
        margin: '0 auto',
        padding: '2rem 0'
      }}>
        {/* Connection line */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '12%',
          right: '12%',
          height: '2px',
          background: 'var(--stacks-border)',
          zIndex: 0
        }} />

        {steps.map((step) => {
          const isActive = step.active.includes(status)

          return (
            <div key={step.id} style={{ flex: 1, position: 'relative', zIndex: 1, textAlign: 'center' }}>
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
                style={{
                  width: '60px',
                  height: '60px',
                  margin: '0 auto 1rem',
                  borderRadius: '50%',
                  background: isActive ? 'var(--stacks-orange)' : 'var(--stacks-gray)',
                  border: `2px solid ${isActive ? 'var(--stacks-orange)' : 'var(--stacks-border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: isActive ? '#fff' : 'var(--stacks-text-secondary)'
                }}
              >
                {step.id}
              </motion.div>
              <div style={{
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--stacks-white)' : 'var(--stacks-text-secondary)'
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
