import { motion } from 'framer-motion'

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        textAlign: 'center',
        marginBottom: '4rem',
        paddingBottom: '2rem',
        borderBottom: '1px solid var(--stacks-border)'
      }}
    >
      <h1 style={{
        fontSize: '3.5rem',
        fontWeight: 800,
        marginBottom: '1rem',
        color: 'var(--stacks-white)'
      }}>
        BitSubs
      </h1>
      <p style={{
        fontSize: '1.25rem',
        color: 'var(--stacks-text-secondary)',
        fontWeight: 400,
        marginBottom: '0.5rem'
      }}>
        Bitcoin Subscriptions on Stacks
      </p>
      <p style={{
        fontSize: '0.95rem',
        color: 'var(--stacks-orange)',
        fontWeight: 600
      }}>
        1000 payments = 2 on-chain transactions • 99.8% gas savings
      </p>
    </motion.header>
  )
}
