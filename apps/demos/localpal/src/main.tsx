import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { announceReady } from '@portfolio/demo-protocol'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Tell the portfolio's DemoShell we've painted (no-op outside an iframe).
requestAnimationFrame(() => announceReady('localpal'))
