import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Auto-recover if a new production deployment changes chunk hashes
window.addEventListener('vite:preloadError', (event) => {
  console.warn('[Vite] Preload error detected. Reloading page for latest assets...', event)
  window.location.reload()
})

window.addEventListener('error', (event) => {
  const msg = event?.message || ''
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Expected a JavaScript-or-Wasm module script')
  ) {
    const reloadKey = 'app_chunk_reload_attempted'
    if (!sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, '1')
      window.location.reload()
    }
  }
})

// Clear guard flag once application successfully boots
try {
  sessionStorage.removeItem('app_chunk_reload_attempted')
} catch {}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

