import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// ── Types ───────────────────────────────────────────────────────────────────

interface ChannelInfo {
  subscriber: string
  service: string
  active: boolean
  remaining: number
  deposit: number
}

interface AgentData {
  name: string
  role: string
  address: string
  requestsServed: number
  requestsMade?: number
  subscribedTo: string | null
  channel: ChannelInfo | null
  lastSignal?: { action: string; confidence: number }
  lastDecision?: { action: string; portfolio: { BTC: number; ETH: number; STX: number; CASH: number } }
}

interface StatsData {
  uptime: number
  totalRequests: number
  totalTransactions: number
  gasReduction: string
  agents: AgentData[]
  contract: string
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const API_URL = 'https://bitsubs-production.up.railway.app'

function truncAddr(addr: string) {
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

function formatUptime(ms: number) {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function channelPercent(ch: ChannelInfo | null) {
  if (!ch || ch.deposit === 0) return 0
  return Math.max(0, Math.min(100, (ch.remaining / ch.deposit) * 100))
}

function barColor(pct: number) {
  if (pct > 60) return 'var(--green)'
  if (pct > 25) return 'var(--yellow)'
  return 'var(--red)'
}

// ── Agent Card ──────────────────────────────────────────────────────────────

function AgentCard({ agent, index }: { agent: AgentData; index: number }) {
  const pct = channelPercent(agent.channel)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      style={{
        background: 'rgba(0,0,0,0.6)',
        border: '1px solid var(--gray-mid)',
        borderRadius: '2px',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        flex: '1 1 280px',
        minWidth: '280px',
      }}
    >
      {/* Pulse glow */}
      <motion.div
        animate={{ opacity: [0.03, 0.08, 0.03] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, var(--orange) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Agent number badge */}
      <div style={{
        position: 'absolute',
        top: '0.75rem',
        right: '0.75rem',
        fontSize: '0.7rem',
        color: 'var(--gray-light)',
        fontFamily: 'monospace',
        letterSpacing: '0.05em',
      }}>
        AGENT_{index + 1}
      </div>

      {/* Name & role */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          color: 'var(--orange)',
          marginBottom: '0.25rem',
          fontFamily: "'IBM Plex Mono', monospace",
        }}>
          {agent.name}
        </div>
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--gray-light)',
          fontFamily: 'monospace',
        }}>
          {agent.role}
        </div>
      </div>

      {/* Address */}
      <a
        href={`https://explorer.hiro.so/address/${agent.address}?chain=testnet`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          fontSize: '0.75rem',
          color: 'var(--orange)',
          fontFamily: 'monospace',
          textDecoration: 'none',
          marginBottom: '1rem',
          borderBottom: '1px dashed rgba(255,107,0,0.3)',
          paddingBottom: '1px',
        }}
      >
        {truncAddr(agent.address)} →
      </a>

      {/* Counters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: agent.requestsMade !== undefined ? '1fr 1fr' : '1fr',
        gap: '0.5rem',
        marginBottom: '1rem',
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          padding: '0.5rem',
          borderRadius: '2px',
          border: '1px solid var(--gray-mid)',
        }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--gray-light)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Served
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--green)' }}>
            {agent.requestsServed}
          </div>
        </div>
        {agent.requestsMade !== undefined && (
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            padding: '0.5rem',
            borderRadius: '2px',
            border: '1px solid var(--gray-mid)',
          }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--gray-light)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Made
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--orange)' }}>
              {agent.requestsMade}
            </div>
          </div>
        )}
      </div>

      {/* Channel balance bar */}
      {agent.channel && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.6rem',
            color: 'var(--gray-light)',
            marginBottom: '0.3rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            <span>Channel → {agent.subscribedTo}</span>
            <span style={{ color: agent.channel.active ? 'var(--green)' : 'var(--red)' }}>
              {agent.channel.active ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
          <div style={{
            height: '6px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '1px',
            overflow: 'hidden',
          }}>
            <motion.div
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: barColor(pct),
                borderRadius: '1px',
              }}
            />
          </div>
          <div style={{
            fontSize: '0.65rem',
            fontFamily: 'monospace',
            color: 'var(--gray-light)',
            marginTop: '0.2rem',
          }}>
            {agent.channel.remaining.toLocaleString()} / {agent.channel.deposit.toLocaleString()} uSTX
          </div>
        </div>
      )}

      {/* Last output */}
      {agent.lastSignal && (
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          padding: '0.5rem',
          borderRadius: '2px',
          border: '1px solid var(--gray-mid)',
          fontSize: '0.75rem',
          fontFamily: 'monospace',
        }}>
          <span style={{ color: 'var(--gray-light)' }}>signal: </span>
          <span style={{
            color: agent.lastSignal.action === 'BUY' ? 'var(--green)' :
                   agent.lastSignal.action === 'SELL' ? 'var(--red)' : 'var(--yellow)',
            fontWeight: 700,
          }}>
            {agent.lastSignal.action}
          </span>
          <span style={{ color: 'var(--gray-light)' }}> @ {agent.lastSignal.confidence}%</span>
        </div>
      )}

      {agent.lastDecision && (
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          padding: '0.5rem',
          borderRadius: '2px',
          border: '1px solid var(--gray-mid)',
          fontSize: '0.7rem',
          fontFamily: 'monospace',
        }}>
          <div style={{ color: 'var(--gray-light)', marginBottom: '0.25rem' }}>
            action: <span style={{ color: 'var(--orange)', fontWeight: 700 }}>{agent.lastDecision.action}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Object.entries(agent.lastDecision.portfolio).map(([k, v]) => (
              <span key={k} style={{ color: 'var(--white)' }}>
                {k}:<span style={{ color: 'var(--green)' }}>{v}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* No channel indicator for Agent 1 */}
      {!agent.channel && !agent.lastSignal && !agent.lastDecision && (
        <div style={{
          background: 'rgba(255,107,0,0.08)',
          padding: '0.5rem',
          borderRadius: '2px',
          border: '1px dashed rgba(255,107,0,0.3)',
          fontSize: '0.7rem',
          fontFamily: 'monospace',
          color: 'var(--orange)',
        }}>
          ROOT DATA PROVIDER
        </div>
      )}
    </motion.div>
  )
}

// ── Arrow Connector ─────────────────────────────────────────────────────────

function FlowArrow({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 0.5rem',
      minWidth: '80px',
    }}>
      <div style={{
        fontSize: '0.6rem',
        color: 'var(--gray-light)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: '0.3rem',
        textAlign: 'center',
        fontFamily: 'monospace',
      }}>
        {label}
      </div>
      <svg width="60" height="20" viewBox="0 0 60 20">
        {/* Animated dashes */}
        <motion.line
          x1="0" y1="10" x2="50" y2="10"
          stroke="var(--orange)"
          strokeWidth="2"
          strokeDasharray="6 4"
          animate={{ strokeDashoffset: [0, -20] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        {/* Arrowhead */}
        <polygon points="48,5 58,10 48,15" fill="var(--orange)" />
      </svg>
    </div>
  )
}

// ── Stat Box ────────────────────────────────────────────────────────────────

function StatBox({ label, value, color = 'var(--white)' }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.5)',
      border: '1px solid var(--gray-mid)',
      borderRadius: '2px',
      padding: '1rem 1.5rem',
      textAlign: 'center',
      flex: '1 1 180px',
    }}>
      <div style={{
        fontSize: '0.6rem',
        color: 'var(--gray-light)',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        marginBottom: '0.4rem',
        fontFamily: 'monospace',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '2rem',
        fontWeight: 700,
        fontFamily: "'IBM Plex Mono', monospace",
        color,
        lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function Economy() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, setPollCount] = useState(0)

  useEffect(() => {
    let active = true

    async function fetchStats() {
      try {
        const res = await fetch(`${API_URL}/api/stats`)
        if (!res.ok) throw new Error(`${res.status}`)
        const data = await res.json()
        if (active) {
          setStats(data)
          setError(null)
          setPollCount(c => c + 1)
        }
      } catch (err: any) {
        if (active) setError(err.message)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 5000)
    return () => { active = false; clearInterval(interval) }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{
        maxWidth: '1300px',
        margin: '0 auto',
        padding: '3rem 2rem 4rem',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '0.5rem',
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--orange)',
            fontFamily: "'IBM Plex Mono', monospace",
            letterSpacing: '-0.02em',
          }}>
            MULTI-AGENT ECONOMY
          </h1>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: stats ? 'var(--green)' : 'var(--red)',
            }}
          />
          <span style={{
            fontSize: '0.7rem',
            color: stats ? 'var(--green)' : 'var(--red)',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
          }}>
            {stats ? 'LIVE' : 'CONNECTING...'}
          </span>
        </div>
        <p style={{
          fontSize: '0.8rem',
          color: 'var(--gray-light)',
          fontFamily: 'monospace',
        }}>
          3 AI agents paying each other through BitSubs subscription channels. Zero gas per request.
        </p>
      </div>

      {error && !stats && (
        <div style={{
          background: 'rgba(255,0,77,0.1)',
          border: '1px solid var(--red)',
          padding: '1.5rem',
          borderRadius: '2px',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          color: 'var(--red)',
          marginBottom: '2rem',
        }}>
          Failed to connect to economy API: {error}
        </div>
      )}

      {stats && (
        <>
          {/* Agent Cards + Arrows */}
          <div style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: '0',
            marginBottom: '2.5rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            <AgentCard agent={stats.agents[0]} index={0} />
            <FlowArrow label="weather data" />
            <AgentCard agent={stats.agents[1]} index={1} />
            <FlowArrow label="trade signals" />
            <AgentCard agent={stats.agents[2]} index={2} />
          </div>

          {/* Data flow label */}
          <div style={{
            textAlign: 'center',
            marginBottom: '2.5rem',
            fontSize: '0.65rem',
            color: 'var(--gray-light)',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
          }}>
            Each arrow = x402 subscription channel | 1 on-chain tx to open | 0 gas per request
          </div>

          {/* Bottom Stats Bar */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
            <StatBox
              label="Total Requests"
              value={stats.totalRequests.toLocaleString()}
              color="var(--green)"
            />
            <StatBox
              label="On-Chain Txns"
              value={stats.totalTransactions}
              color="var(--orange)"
            />
            <StatBox
              label="Gas Reduction"
              value={stats.gasReduction}
              color="var(--green)"
            />
            <StatBox
              label="Uptime"
              value={formatUptime(stats.uptime)}
              color="var(--white)"
            />
          </div>

          {/* Contract link */}
          <div style={{
            marginTop: '2rem',
            textAlign: 'center',
            fontSize: '0.7rem',
            fontFamily: 'monospace',
            color: 'var(--gray-light)',
          }}>
            contract:{' '}
            <a
              href={`https://explorer.hiro.so/txid/${stats.contract}?chain=testnet`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--orange)', textDecoration: 'none', borderBottom: '1px dashed rgba(255,107,0,0.3)' }}
            >
              {stats.contract}
            </a>
          </div>
        </>
      )}
    </motion.div>
  )
}
