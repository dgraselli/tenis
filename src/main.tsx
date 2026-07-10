import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { StoreProvider } from './app/store.tsx'
import { createLocalStorageRepo } from './persistence/localStorageRepo.ts'
import './index.css'

const repo = createLocalStorageRepo(window.localStorage)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider repo={repo}>
      <App />
    </StoreProvider>
  </StrictMode>,
)

// Solo en producción: en desarrollo el service worker cachearía los assets y
// pisaría el hot reload.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('No se pudo registrar el service worker:', err)
    })
  })
}
