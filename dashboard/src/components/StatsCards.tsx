interface Props {
  stats: {
    totalRequests: number
    successfulRequests: number
    onChainTxs: number
    gasSavings: number
  }
}

export default function StatsCards({ stats }: Props) {
  const cards = [
    { label: 'Total Requests', value: stats.totalRequests.toLocaleString() },
    { label: 'Successful', value: stats.successfulRequests.toLocaleString() },
    { label: 'On-Chain Transactions', value: stats.onChainTxs },
    { label: 'Gas Savings', value: `${stats.gasSavings.toFixed(2)}%` }
  ]

  return (
    <>
      {cards.map((card) => (
        <div key={card.label} className="stat-card">
          <div className="stat-value">{card.value}</div>
          <div className="stat-label">{card.label}</div>
        </div>
      ))}
    </>
  )
}
