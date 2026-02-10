import { motion } from 'framer-motion'

interface Props {
  blockchain: {
    contractAddress: string
    txId: string | null
    blockHeight: number
  }
}

export default function BlockchainInfo({ blockchain }: Props) {
  const truncate = (str: string, len: number = 20) => {
    if (str.length <= len) return str
    return `${str.slice(0, len / 2)}...${str.slice(-len / 2)}`
  }

  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <h3 style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '1.2rem',
        marginBottom: '1.5rem',
        color: '#00F0FF',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      }}>
        Blockchain Info
      </h3>

      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.85rem'
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ color: '#888', marginBottom: '0.5rem' }}>CONTRACT ADDRESS</div>
          <div style={{
            color: '#5546FF',
            background: 'rgba(85, 70, 255, 0.1)',
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid rgba(85, 70, 255, 0.3)',
            wordBreak: 'break-all'
          }}>
            {truncate(blockchain.contractAddress, 30)}
          </div>
        </div>

        {blockchain.txId && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ color: '#888', marginBottom: '0.5rem' }}>TRANSACTION ID</div>
            <div style={{
              color: '#F7931A',
              background: 'rgba(247, 147, 26, 0.1)',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(247, 147, 26, 0.3)',
              wordBreak: 'break-all'
            }}>
              {truncate(blockchain.txId, 30)}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ color: '#888', marginBottom: '0.5rem' }}>NETWORK</div>
          <div style={{
            color: '#39FF14',
            background: 'rgba(57, 255, 20, 0.1)',
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid rgba(57, 255, 20, 0.3)'
          }}>
            Stacks Testnet
          </div>
        </div>

        <a
          href={`https://explorer.hiro.so/txid/${blockchain.txId}?chain=testnet`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '0.75rem',
            background: 'linear-gradient(135deg, #F7931A, #5546FF)',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
            e.currentTarget.style.boxShadow = '0 0 20px rgba(247, 147, 26, 0.6)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          View on Explorer →
        </a>
      </div>
    </motion.div>
  )
}
