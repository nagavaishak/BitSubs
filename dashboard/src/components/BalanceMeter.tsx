interface Props {
  balance: number
  totalDeposit: number
}

export default function BalanceMeter({ balance, totalDeposit }: Props) {
  const percentage = (balance / totalDeposit) * 100

  return (
    <div>
      <div className="balance-progress">
        <div
          className="balance-progress-bar"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="balance-stats">
        <div>
          <div className="balance-label">Current Balance</div>
          <div className="balance-value">
            {(balance / 1000000).toFixed(3)} STX
          </div>
        </div>
        <div>
          <div className="balance-label">Remaining</div>
          <div className="balance-value" style={{ color: '#5546FF' }}>
            {percentage.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  )
}
