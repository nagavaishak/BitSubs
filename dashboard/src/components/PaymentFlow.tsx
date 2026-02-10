interface Props {
  status: 'closed' | 'opening' | 'active' | 'expired' | 'closing'
}

export default function PaymentFlow({ status }: Props) {
  const steps = [
    { id: 1, label: 'Open Channel', active: ['opening', 'active', 'expired', 'closing'] },
    { id: 2, label: 'Stream Payments', active: ['active', 'expired', 'closing'] },
    { id: 3, label: 'Auto-Expire', active: ['expired', 'closing'] },
    { id: 4, label: 'Close & Settle', active: ['closing'] }
  ]

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
      maxWidth: '900px',
      margin: '0 auto',
      padding: '2rem 0'
    }}>
      {/* Connection line */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '12%',
        right: '12%',
        height: '2px',
        background: '#E8E6E3',
        zIndex: 0
      }} />

      {steps.map((step) => {
        const isActive = step.active.includes(status)

        return (
          <div key={step.id} style={{ flex: 1, position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 1rem',
              borderRadius: '50%',
              background: isActive ? '#5546FF' : '#E8E6E3',
              border: `2px solid ${isActive ? '#5546FF' : '#E8E6E3'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: isActive ? '#fff' : '#71717A',
              transition: 'all 0.3s ease'
            }}>
              {step.id}
            </div>
            <div style={{
              fontSize: '0.9rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#18181B' : '#71717A'
            }}>
              {step.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}
