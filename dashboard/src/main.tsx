import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Connect } from '@stacks/connect-react'
import App from './App.tsx'

const appDetails = {
  name: 'BitSubs',
  icon: window.location.origin + '/vite.svg'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Connect
      authOptions={{
        appDetails,
        redirectTo: '/',
        onFinish: () => {
          window.location.reload()
        },
        userSession: undefined
      }}
    >
      <App />
    </Connect>
  </StrictMode>,
)
