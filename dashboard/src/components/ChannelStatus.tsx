interface Props {
  status: 'closed' | 'opening' | 'active' | 'expired' | 'closing'
}

export default function ChannelStatus({ status }: Props) {
  const statusConfig = {
    closed: { label: 'Channel Closed', badge: 'inactive' },
    opening: { label: 'Opening Channel...', badge: 'warning' },
    active: { label: 'Channel Active', badge: 'active' },
    expired: { label: 'Subscription Expired', badge: 'error' },
    closing: { label: 'Closing Channel...', badge: 'warning' }
  }

  const config = statusConfig[status]

  return (
    <span className={`status-badge ${config.badge}`}>
      {config.label}
    </span>
  )
}
