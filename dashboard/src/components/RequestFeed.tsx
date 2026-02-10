import { motion, AnimatePresence } from 'framer-motion'

interface Request {
  id: number
  endpoint: string
  status: number
  timestamp: number
}

interface Props {
  requests: Request[]
}

export default function RequestFeed({ requests }: Props) {
  return (
    <motion.div
      className="stacks-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      style={{ height: '500px', display: 'flex', flexDirection: 'column' }}
    >
      <h3 className="section-title" style={{ marginBottom: '1rem' }}>
        Live Request Feed
      </h3>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        fontSize: '0.875rem'
      }}>
        <AnimatePresence>
          {requests.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                background: 'var(--stacks-dark)',
                border: `1px solid var(--stacks-border)`,
                borderRadius: '6px',
                borderLeftWidth: '3px',
                borderLeftColor: req.status === 200 ? '#22C55E' : '#EF4444',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                flex: 1
              }}>
                <span style={{
                  fontWeight: 700,
                  color: req.status === 200 ? '#22C55E' : '#EF4444',
                  minWidth: '40px'
                }}>
                  {req.status}
                </span>
                <span style={{
                  color: 'var(--stacks-text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {req.endpoint}
                </span>
              </div>
              <span style={{
                color: 'var(--stacks-light-gray)',
                fontSize: '0.75rem',
                minWidth: '50px',
                textAlign: 'right'
              }}>
                #{req.id}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {requests.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: 'var(--stacks-text-secondary)',
            padding: '4rem 0',
            fontSize: '0.9rem'
          }}>
            No requests yet. Click "Start Live Demo" to begin.
          </div>
        )}
      </div>
    </motion.div>
  )
}
