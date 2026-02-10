import { motion } from 'framer-motion'

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      style={{
        textAlign: 'center',
        marginBottom: '3rem',
        padding: '2rem 0'
      }}
    >
      <h1 style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '4rem',
        fontWeight: 900,
        background: 'linear-gradient(135deg, #F7931A, #5546FF)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '4px'
      }}>
        BitSubs
      </h1>
      <p style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '1.2rem',
        color: '#00F0FF',
        textShadow: '0 0 10px #00F0FF',
        letterSpacing: '2px'
      }}>
        BITCOIN SUBSCRIPTIONS VIA X402 ON STACKS
      </p>
      <div style={{
        marginTop: '1rem',
        fontSize: '0.9rem',
        color: '#888',
        fontFamily: 'JetBrains Mono, monospace'
      }}>
        <code>1000 PAYMENTS = 2 ON-CHAIN TRANSACTIONS</code>
      </div>
    </motion.header>
  )
}
