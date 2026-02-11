import { useState, useEffect } from 'react'
import { AppConfig, UserSession, showConnect, openContractCall } from '@stacks/connect'
import {
  callReadOnlyFunction,
  principalCV,
  uintCV,
  AnchorMode,
  cvToJSON,
  PostConditionMode
} from '@stacks/transactions'
import { StacksTestnet } from '@stacks/network'

const CONTRACT_ADDRESS = 'ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP'
const CONTRACT_NAME = 'subscription-channel-v2'
const SERVICE_ADDRESS = 'ST4FEH4FQ6JKFY4YQ8MENBX5PET23CE9JD2G2XMP'
const API_URL = 'https://bitsubs-production.up.railway.app'

const appConfig = new AppConfig(['store_write', 'publish_data'])
const userSession = new UserSession({ appConfig })

export default function RealWalletDemo() {
  const [userData, setUserData] = useState<any>(null)
  const [channelState, setChannelState] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [isOpening, setIsOpening] = useState(false)
  const [requestCount, setRequestCount] = useState(0)

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const data = userSession.loadUserData()
      setUserData(data)
    }
  }, [])

  // Removed automatic channel checking to prevent errors
  // Users can manually refresh balance with the button

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20))
  }

  const connectWallet = () => {
    console.log('Connect wallet button clicked!')
    try {
      showConnect({
        appDetails: {
          name: 'BitSubs',
          icon: window.location.origin + '/vite.svg'
        },
        onFinish: () => {
          console.log('Wallet connection finished')
          const data = userSession.loadUserData()
          setUserData(data)
          addLog('✅ Wallet connected')
          checkChannelState()
        },
        onCancel: () => {
          console.log('Wallet connection cancelled')
          addLog('❌ Wallet connection cancelled')
        },
        userSession
      })
    } catch (error: any) {
      console.error('Error connecting wallet:', error)
      addLog(`❌ Error: ${error.message}`)
    }
  }

  const checkChannelState = async () => {
    if (!userData) return

    try {
      const result = await callReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'verify-payment',
        functionArgs: [
          principalCV(userData.profile.stxAddress.testnet),
          principalCV(SERVICE_ADDRESS)
        ],
        network: new StacksTestnet(),
        senderAddress: userData.profile.stxAddress.testnet
      })

      const state = cvToJSON(result)
      setChannelState(state.value)

      if (state.value?.active?.value) {
        addLog(`📊 Channel active - Balance: ${state.value.remaining?.value} µSTX`)
      }
    } catch (error: any) {
      // Silently set channel as closed if not found (expected behavior)
      console.log('No channel found:', error.message)
      setChannelState({ active: { value: false } })
      // Don't show error in UI - it's expected when no channel exists
    }
  }

  const openChannel = async () => {
    if (!userData) return
    setIsOpening(true)

    try {
      addLog('💰 Opening subscription channel...')
      addLog('   Deposit: 1 STX (1,000,000 µSTX)')
      addLog('   Rate: 100 µSTX per block')

      const txOptions = {
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'open-channel',
        functionArgs: [
          principalCV(SERVICE_ADDRESS),
          uintCV(1000000),
          uintCV(100)
        ],
        network: new StacksTestnet(),
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data: any) => {
          addLog(`✅ Transaction submitted!`)
          addLog(`   TX: ${data.txId}`)
          addLog(`   View: https://explorer.hiro.so/txid/${data.txId}?chain=testnet`)
          addLog('   ⏳ Waiting for confirmation (~5-10 min)...')
          pollForConfirmation(data.txId)
        },
        onCancel: () => {
          addLog('❌ Transaction cancelled')
          setIsOpening(false)
        }
      }

      await openContractCall(txOptions)
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`)
      setIsOpening(false)
    }
  }

  const pollForConfirmation = async (_txId: string) => {
    addLog('🔄 Polling for confirmation...')

    for (let i = 0; i < 40; i++) {
      await sleep(15000) // Poll every 15 seconds

      try {
        await checkChannelState()

        if (channelState?.active?.value) {
          addLog('✅ Channel confirmed on-chain!')
          addLog('🎉 Ready to make x402 requests!')
          setIsOpening(false)
          return
        }
      } catch (e) {
        // Keep polling
      }
    }

    addLog('⚠️ Confirmation taking longer than expected. Refresh page.')
    setIsOpening(false)
  }

  const makeRequest = async () => {
    if (!userData || !channelState?.active?.value) {
      addLog('❌ Need active channel first')
      return
    }

    try {
      addLog(`📡 Making x402 request #${requestCount + 1}...`)

      // Generate payment proof
      const sigRes = await fetch(`${API_URL}/api/demo/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource: '/api/premium/weather' })
      })
      const { signature } = await sigRes.json()

      // Make request with proof
      const response = await fetch(`${API_URL}/api/premium/weather`, {
        headers: {
          'x-payment-proof': signature,
          'x-stacks-address': userData.profile.stxAddress.testnet
        }
      })

      if (response.status === 200) {
        const data = await response.json()
        addLog(`✅ Request #${requestCount + 1} succeeded: ${data.temperature}°F`)
        setRequestCount(prev => prev + 1)
        await checkChannelState()
      } else if (response.status === 402) {
        addLog('⛔ Subscription expired - balance depleted!')
        setChannelState({ active: { value: false } })
      }
    } catch (error: any) {
      addLog(`❌ Request failed: ${error.message}`)
    }
  }

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--stacks-orange)' }}>
        Real Wallet Demo
      </h2>
      <p style={{ marginBottom: '2rem', color: 'var(--stacks-text-secondary)' }}>
        Connect YOUR wallet and make REAL x402 payments on Stacks testnet
      </p>

      {!userData ? (
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
            onClick={connectWallet}
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
            🔗 Connect Stacks Wallet
          </button>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--stacks-text-secondary)' }}>
            Need testnet STX?{' '}
            <a
              href="https://explorer.hiro.so/sandbox/faucet?chain=testnet"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--stacks-orange)', textDecoration: 'underline' }}
            >
              Get from faucet →
            </a>
          </p>
        </div>
      ) : (
        <>
          {/* Connected State */}
          <div style={{
            background: 'rgba(0, 255, 0, 0.1)',
            border: '2px solid #0f0',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: '#0f0', marginBottom: '0.5rem' }}>✅ Wallet Connected</h3>
                <p style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--stacks-text-secondary)' }}>
                  {userData.profile.stxAddress.testnet}
                </p>
              </div>
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
            </div>
          </div>

          {/* Channel Stats */}
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
                  <p style={{ fontSize: '2rem', color: '#0f0', fontWeight: 'bold' }}>✅ Active</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--stacks-text-secondary)', marginTop: '0.5rem' }}>
                    Balance: {channelState.remaining?.value} µSTX
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '2rem', color: '#666', fontWeight: 'bold' }}>⚪ Closed</p>
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

          {/* Actions */}
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
                  {isOpening ? '⏳ Opening Channel...' : '🔓 Open Subscription Channel'}
                </button>
                <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--stacks-text-secondary)' }}>
                  Cost: 1 STX deposit • Rate: 100 µSTX per block • Wallet will prompt for signature
                </p>
              </div>
            )}

            {channelState?.active?.value && (
              <div>
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
                  📡 Make x402 Request
                </button>
                <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--stacks-text-secondary)' }}>
                  Each request verifies your channel balance and returns weather data
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Activity Log */}
      {logs.length > 0 && (
        <div style={{
          background: '#000',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid var(--stacks-orange)'
        }}>
          <h3 style={{ color: 'var(--stacks-orange)', marginBottom: '1rem' }}>🔍 Live Activity Log</h3>
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

      {/* Info Panel */}
      <div style={{
        marginTop: '2rem',
        background: 'rgba(66, 135, 245, 0.1)',
        border: '2px solid #4287f5',
        padding: '1.5rem',
        borderRadius: '8px'
      }}>
        <h3 style={{ color: '#4287f5', marginBottom: '1rem' }}>💡 What You're Testing</h3>
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
