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
      className="glass-card"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      style={{ height: '600px', display: 'flex', flexDirection: 'column' }}
    >
      <h3 style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '1.2rem',
        marginBottom: '1rem',
        color: '#00F0FF',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      }}>
        Live Request Feed
      </h3>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.85rem'
      }}>
        <AnimatePresence>
          {requests.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                background: req.status === 200
                  ? 'rgba(57, 255, 20, 0.1)'
                  : 'rgba(255, 68, 68, 0.1)',
                border: `1px solid ${req.status === 200 ? '#39FF14' : '#ff4444'}`,
                borderRadius: '8px',
                display: 'grid',
                gridTemplateColumns: '60px 1fr 60px',
                gap: '1rem',
                alignItems: 'center'
              }}
            >
              <div style={{
                color: req.status === 200 ? '#39FF14' : '#ff4444',
                fontWeight: 'bold'
              }}>
                {req.status}
              </div>
              <div style={{ color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {req.endpoint}
              </div>
              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                #{req.id}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {requests.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#666',
            padding: '4rem 0',
            fontSize: '1rem'
          }}>
            Waiting for requests...
          </div>
        )}
      </div>
    </motion.div>
  )
}
