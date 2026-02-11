import { useState, useEffect, useCallback } from 'react'
import { connect, disconnect as disconnectWallet, isConnected, request } from '@stacks/connect'
import { principalCV, uintCV, fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions'
import { STACKS_TESTNET } from '@stacks/network'

const CONTRACT_ADDRESS = 'ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP'
const CONTRACT_NAME = 'subscription-channel-v2'
const SERVICE_ADDRESS = 'ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP'
const API_URL = 'https://bitsubs-production.up.railway.app'

export default function RealWalletDemo() {
  const [stxAddress, setStxAddress] = useState<string | null>(null)
  const [channelState, setChannelState] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [isOpening, setIsOpening] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [requestCount, setRequestCount] = useState(0)

  useEffect(() => {
    // Check if already connected
    if (isConnected()) {
      try {
        const stored = localStorage.getItem('stx_address')
        // Validate it's a Stacks address (starts with S)
        if (stored && (stored.startsWith('ST') || stored.startsWith('SP'))) {
          setStxAddress(stored)
        } else {
          // Clear invalid address (Bitcoin address was cached)
          localStorage.removeItem('stx_address')
          addLog('Please reconnect wallet - invalid address cleared')
        }
      } catch (_) {}
    }
  }, [])

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20))
  }, [])

  const handleConnect = useCallback(async () => {
    try {
      const response = await connect()
      const addresses = response.addresses
      if (addresses && addresses.length > 0) {
        // Find the Stacks address (starts with ST for testnet or SP for mainnet)
        const stxAddr = addresses.find(a => a.address.startsWith('ST') || a.address.startsWith('SP'))
        if (stxAddr) {
          setStxAddress(stxAddr.address)
          localStorage.setItem('stx_address', stxAddr.address)
          addLog('Wallet connected: ' + stxAddr.address)
        } else {
          addLog('Error: No Stacks address found in wallet')
        }
      }
    } catch (error: any) {
      console.error('Connect error:', error)
      addLog('Error connecting: ' + (error.message || String(error)))
    }
  }, [addLog])

  const handleDisconnect = useCallback(() => {
    disconnectWallet()
    localStorage.removeItem('stx_address')
    setStxAddress(null)
    setChannelState(null)
    setLogs([])
    setRequestCount(0)
  }, [])

  const checkChannelState = useCallback(async () => {
    if (!stxAddress) return

    addLog('Checking channel state...')

    try {
      const result = await fetchCallReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'verify-payment',
        functionArgs: [
          principalCV(stxAddress),
          principalCV(SERVICE_ADDRESS)
        ],
        network: STACKS_TESTNET,
        senderAddress: stxAddress
      })

      const state = cvToJSON(result)
      console.log('Channel state:', state)

      if (state.value?.active?.value === true) {
        setChannelState(state.value)
        addLog(`Channel ACTIVE - Balance: ${state.value.remaining?.value || 'N/A'} µSTX`)
      } else {
        setChannelState({ active: { value: false } })
        addLog('Channel not found or closed')
      }
    } catch (error: any) {
      console.error('Error checking channel:', error)
      setChannelState({ active: { value: false } })
      addLog('Error checking channel: ' + error.message)
    }
  }, [stxAddress, addLog])

  const openChannel = async () => {
    if (!stxAddress) return
    setIsOpening(true)

    try {
      addLog('Opening subscription channel...')
      addLog('Deposit: 1 STX | Rate: 100 uSTX per block')

      const txParams = {
        contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}` as `${string}.${string}`,
        functionName: 'open-channel',
        functionArgs: [
          principalCV(SERVICE_ADDRESS),
          uintCV(1000000),
          uintCV(100)
        ],
        network: 'testnet' as const,
        postConditionMode: 'allow' as const
      }

      const response = await request('stx_callContract', txParams)

      if (response.txid) {
        addLog('Transaction submitted! TX: ' + response.txid)
        addLog('View: https://explorer.hiro.so/txid/' + response.txid + '?chain=testnet')
        addLog('Checking transaction status...')

        // Poll for transaction result to detect ERR-CHANNEL-EXISTS
        let attempts = 0
        const pollInterval = setInterval(async () => {
          attempts++
          try {
            const txResponse = await fetch(`https://api.testnet.hiro.so/extended/v1/tx/0x${response.txid}`)
            if (txResponse.ok) {
              const txData = await txResponse.json()
              if (txData.tx_status === 'abort_by_response') {
                clearInterval(pollInterval)
                const errorCode = txData.tx_result?.repr
                if (errorCode?.includes('u409')) {
                  addLog('ERROR: Channel already exists! Checking existing channel...')
                  await checkChannelState()
                  addLog('Please close the existing channel first using the button below')
                } else {
                  addLog('Transaction failed: ' + errorCode)
                }
                setIsOpening(false)
              } else if (txData.tx_status === 'success') {
                clearInterval(pollInterval)
                addLog('Channel opened successfully!')
                await checkChannelState()
                setIsOpening(false)
              }
            }
          } catch (e) {
            // Continue polling
          }

          // Stop polling after 2 minutes
          if (attempts >= 24) {
            clearInterval(pollInterval)
            addLog('Taking longer than expected. Click Refresh Balance to check status.')
            setIsOpening(false)
          }
        }, 5000) // Poll every 5 seconds
      } else {
        setIsOpening(false)
      }
    } catch (error: any) {
      addLog('Error: ' + (error.message || String(error)))
      setIsOpening(false)
    }
  }

  const closeChannel = async () => {
    if (!stxAddress) return
    setIsClosing(true)

    try {
      addLog('Closing channel and withdrawing balance...')

      const txParams = {
        contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}` as `${string}.${string}`,
        functionName: 'close-channel',
        functionArgs: [
          principalCV(SERVICE_ADDRESS)
        ],
        network: 'testnet' as const,
        postConditionMode: 'allow' as const
      }

      const response = await request('stx_callContract', txParams)

      if (response.txid) {
        addLog('Close transaction submitted! TX: ' + response.txid)
        addLog('View: https://explorer.hiro.so/txid/' + response.txid + '?chain=testnet')
        addLog('Channel will close and balance will be refunded (~5-10 min)...')
        setChannelState({ active: { value: false } })
      }
      setIsClosing(false)
    } catch (error: any) {
      addLog('Error closing channel: ' + (error.message || String(error)))
      setIsClosing(false)
    }
  }

  const makeRequest = async () => {
    if (!stxAddress || !channelState?.active?.value) {
      addLog('Need active channel first')
      return
    }

    try {
      addLog('Making x402 request #' + (requestCount + 1) + '...')

      const sigRes = await fetch(API_URL + '/api/demo/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource: '/api/premium/weather' })
      })
      const { signature } = await sigRes.json()

      const response = await fetch(API_URL + '/api/premium/weather', {
        headers: {
          'x-payment-proof': signature,
          'x-stacks-address': stxAddress
        }
      })

      if (response.status === 200) {
        const data = await response.json()
        addLog('Request #' + (requestCount + 1) + ' succeeded: ' + data.temperature + 'F')
        setRequestCount(prev => prev + 1)
        await checkChannelState()
      } else if (response.status === 402) {
        addLog('Subscription expired - balance depleted!')
        setChannelState({ active: { value: false } })
      }
    } catch (error: any) {
      addLog('Request failed: ' + error.message)
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--stacks-orange)' }}>
        Real Wallet Demo
      </h2>
      <p style={{ marginBottom: '2rem', color: 'var(--stacks-text-secondary)' }}>
        Connect YOUR wallet and make REAL x402 payments on Stacks testnet
      </p>

      {!stxAddress ? (
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          padding: '2rem',
          borderRadius: '8px',
          border: '1px solid var(--stacks-border)',
          marginBottom: '2rem'
        }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--stacks-orange)' }}>
            Step 1: Connect Wallet
          </h3>
          <p style={{ marginBottom: '1rem', color: 'var(--stacks-text-secondary)' }}>
            Connect your Stacks wallet (Leather, Xverse, Hiro). Make sure you're on testnet.
          </p>
          <button
            onClick={handleConnect}
            style={{
              background: '#FF7200',
              color: '#FFFFFF',
              padding: '1.25rem 2.5rem',
              border: '2px solid #FF7200',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255, 114, 0, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FF8533'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FF7200'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Connect Stacks Wallet
          </button>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--stacks-text-secondary)' }}>
            Need testnet STX?{' '}
            <a
              href="https://explorer.hiro.so/sandbox/faucet?chain=testnet"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--stacks-orange)', textDecoration: 'underline' }}
            >
              Get from faucet
            </a>
          </p>
        </div>
      ) : (
        <>
          <div style={{
            background: 'rgba(0, 255, 0, 0.1)',
            border: '2px solid #0f0',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: '#0f0', marginBottom: '0.5rem' }}>Wallet Connected</h3>
                <p style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--stacks-text-secondary)' }}>
                  {stxAddress}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={checkChannelState}
                  style={{
                    background: 'transparent',
                    color: '#0f0',
                    border: '1px solid #0f0',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Refresh Balance
                </button>
                <button
                  onClick={handleDisconnect}
                  style={{
                    background: 'transparent',
                    color: '#f55',
                    border: '1px solid #f55',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid var(--stacks-border)'
            }}>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--stacks-text-secondary)' }}>Channel Status</h4>
              {channelState?.active?.value ? (
                <div>
                  <p style={{ fontSize: '2rem', color: '#0f0', fontWeight: 'bold' }}>Active</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--stacks-text-secondary)', marginTop: '0.5rem' }}>
                    Balance: {channelState.remaining?.value} uSTX
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '2rem', color: '#666', fontWeight: 'bold' }}>Closed</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--stacks-text-secondary)', marginTop: '0.5rem' }}>
                    Open a channel to start
                  </p>
                </div>
              )}
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid var(--stacks-border)'
            }}>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--stacks-text-secondary)' }}>Requests Made</h4>
              <p style={{ fontSize: '3rem', color: 'var(--stacks-orange)', fontWeight: 'bold' }}>{requestCount}</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--stacks-text-secondary)', marginTop: '0.5rem' }}>
                Successful x402 requests
              </p>
            </div>
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '2rem',
            borderRadius: '8px',
            border: '1px solid var(--stacks-border)',
            marginBottom: '2rem'
          }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--stacks-orange)' }}>Actions</h3>

            {!channelState?.active?.value && (
              <div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button
                    onClick={openChannel}
                    disabled={isOpening}
                    style={{
                      background: isOpening ? '#666' : 'var(--stacks-orange)',
                      color: '#000',
                      padding: '1rem 2rem',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      cursor: isOpening ? 'not-allowed' : 'pointer',
                      opacity: isOpening ? 0.5 : 1
                    }}
                  >
                    {isOpening ? 'Opening Channel...' : 'Open Subscription Channel'}
                  </button>
                  <button
                    onClick={checkChannelState}
                    style={{
                      background: 'transparent',
                      color: '#4287f5',
                      padding: '1rem 2rem',
                      border: '2px solid #4287f5',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Check for Existing Channel
                  </button>
                </div>
                <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--stacks-text-secondary)' }}>
                  Cost: 1 STX deposit | Rate: 100 uSTX per block | If opening fails, check for existing channel first
                </p>
              </div>
            )}

            {channelState?.active?.value && (
              <div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button
                    onClick={makeRequest}
                    style={{
                      background: '#4287f5',
                      color: '#fff',
                      padding: '1rem 2rem',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Make x402 Request
                  </button>
                  <button
                    onClick={closeChannel}
                    disabled={isClosing}
                    style={{
                      background: 'transparent',
                      color: '#f55',
                      padding: '1rem 2rem',
                      border: '2px solid #f55',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      cursor: isClosing ? 'not-allowed' : 'pointer',
                      opacity: isClosing ? 0.5 : 1
                    }}
                  >
                    {isClosing ? 'Closing...' : 'Close Channel'}
                  </button>
                </div>
                <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--stacks-text-secondary)' }}>
                  Each request verifies your channel balance and returns weather data. Close channel to withdraw remaining balance.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {logs.length > 0 && (
        <div style={{
          background: '#000',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid var(--stacks-orange)'
        }}>
          <h3 style={{ color: 'var(--stacks-orange)', marginBottom: '1rem' }}>Live Activity Log</h3>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {logs.map((log, i) => (
              <div key={i} style={{ color: '#0f0', marginBottom: '0.25rem' }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        marginTop: '2rem',
        background: 'rgba(66, 135, 245, 0.1)',
        border: '2px solid #4287f5',
        padding: '1.5rem',
        borderRadius: '8px'
      }}>
        <h3 style={{ color: '#4287f5', marginBottom: '1rem' }}>What You're Testing</h3>
        <ul style={{ listStyle: 'disc', paddingLeft: '2rem', color: 'var(--stacks-text-secondary)', lineHeight: '1.8' }}>
          <li><strong style={{ color: 'var(--stacks-white)' }}>Real x402 protocol</strong> on Stacks testnet</li>
          <li><strong style={{ color: 'var(--stacks-white)' }}>Your own wallet</strong> making real payments</li>
          <li><strong style={{ color: 'var(--stacks-white)' }}>Real blockchain transactions</strong> (check explorer)</li>
          <li><strong style={{ color: 'var(--stacks-white)' }}>Mathematical balance drain</strong> (watch it deplete)</li>
          <li><strong style={{ color: 'var(--stacks-white)' }}>Automatic expiration</strong> when balance hits zero</li>
          <li><strong style={{ color: 'var(--stacks-white)' }}>2 on-chain tx</strong> for unlimited requests (open + close)</li>
        </ul>
      </div>
    </div>
  )
}
