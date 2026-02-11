interface Request {
  id: number
  endpoint: string
  status: number | 'pending' | 'success' | 'error'
  timestamp: number
}

interface Props {
  requests: Request[]
}

export default function RequestFeed({ requests }: Props) {
  return (
    <div style={{ height: '500px', overflowY: 'auto' }}>
      {requests.map((req) => (
        <div key={req.id} className="request-item">
          <span className={`request-status ${req.status === 200 || req.status === 'success' ? 'success' : req.status === 'pending' ? 'pending' : 'error'}`}>
            {typeof req.status === 'number' ? req.status : req.status.toUpperCase()}
          </span>
          <span className="request-endpoint">
            {req.endpoint}
          </span>
          <span className="request-id">
            #{req.id}
          </span>
        </div>
      ))}

      {requests.length === 0 && (
        <div style={{
          textAlign: 'center',
          color: '#71717A',
          padding: '4rem 0',
          fontSize: '0.9rem'
        }}>
          No requests yet. Click "Start Live Demo" to begin.
        </div>
      )}
    </div>
  )
}
