import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

try {
  localStorage.removeItem('geo-gallery-store-v3')
} catch {
  // ignore storage errors
}

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element #root not found')
}

createRoot(root).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)

const boot = document.getElementById('boot')
if (boot) boot.remove()
