import { motion } from 'framer-motion'

interface Props {
  blockchain: {
    contractAddress: string
    txId: string | null
    blockHeight: number
  }
}

export default function BlockchainInfo({ blockchain }: Props) {
  const truncate = (str: string, len: number = 16) => {
    if (str.length <= len) return str
    return `${str.slice(0, len / 2)}...${str.slice(-len / 2)}`
  }

  return (
    <motion.div
      className="stacks-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <h3 className="section-title" style={{ marginBottom: '1.5rem' }}>
        Blockchain Information
      </h3>

      <div style={{ fontSize: '0.875rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ color: 'var(--stacks-text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
            Contract Address
          </div>
          <div style={{
            color: 'var(--stacks-white)',
            background: 'var(--stacks-dark)',
            padding: '0.75rem',
            borderRadius: '6px',
            border: '1px solid var(--stacks-border)',
            wordBreak: 'break-all',
            fontFamily: 'monospace',
            fontSize: '0.8rem'
          }}>
            {truncate(blockchain.contractAddress, 24)}
          </div>
        </div>

        {blockchain.txId && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ color: 'var(--stacks-text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
              Transaction ID
            </div>
            <div style={{
              color: 'var(--stacks-white)',
              background: 'var(--stacks-dark)',
              padding: '0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--stacks-border)',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              fontSize: '0.8rem'
            }}>
              {truncate(blockchain.txId, 24)}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ color: 'var(--stacks-text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
            Network
          </div>
          <div style={{
            color: '#22C55E',
            fontWeight: 600
          }}>
            Stacks Testnet
          </div>
        </div>

        {blockchain.txId && (
          <a
            href={`https://explorer.hiro.so/txid/${blockchain.txId}?chain=testnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="stacks-button"
            style={{
              display: 'block',
              textAlign: 'center',
              textDecoration: 'none',
              fontSize: '0.9rem',
              padding: '0.75rem 1.5rem'
            }}
          >
            View on Explorer →
          </a>
        )}
      </div>
    </motion.div>
  )
}
