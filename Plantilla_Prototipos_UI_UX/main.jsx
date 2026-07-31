import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './src/App.jsx'
import { queryClient } from './src/lib/queryClient'
import { ConnectivityGate } from './src/components/ConnectivityGate'
import './src/styles/responsive.css'

import * as Sentry from '@sentry/react'

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// [DEV] Exposición para verificación empírica de la capa de sesión (Fase 38).
// Solo en desarrollo; permite probar login/refresh desde la consola/preview.
if (import.meta.env.DEV) {
  import('./src/lib/api').then((api) => { window.__api = api; })
  import('./src/store/authStore').then((m) => { window.__authStore = m.useAuthStore; })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ConnectivityGate>
          <App />
        </ConnectivityGate>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
