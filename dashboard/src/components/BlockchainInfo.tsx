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
    <div>
      <div className="blockchain-info-item">
        <div className="blockchain-label">Contract Address</div>
        <div className="blockchain-value">
          {truncate(blockchain.contractAddress, 24)}
        </div>
      </div>

      {blockchain.txId && (
        <div className="blockchain-info-item">
          <div className="blockchain-label">Transaction ID</div>
          <div className="blockchain-value">
            {truncate(blockchain.txId, 24)}
          </div>
        </div>
      )}

      <div className="blockchain-info-item">
        <div className="blockchain-label">Network</div>
        <div style={{ color: '#22C55E', fontWeight: 600 }}>
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
            padding: '0.75rem 1.5rem',
            marginTop: '1rem'
          }}
        >
          View on Explorer →
        </a>
      )}
    </div>
  )
}
