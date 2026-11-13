import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { initializeTheme } from './lib/theme'
import { VaultSessionProvider } from './providers/VaultSessionProvider'
import './index.css'
import { cleanupLegacyVault } from './lib/legacyVaultCleanup'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
    }
  }
})

initializeTheme()

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
const renderApp = () =>
  root.render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <VaultSessionProvider>
          <App />
        </VaultSessionProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )

const start = () =>
  cleanupLegacyVault()
    .then(renderApp)
    .catch((error: unknown) => {
      root.render(
        <main className="mx-auto max-w-lg space-y-4 p-8" role="alert">
          <h1 className="text-xl font-semibold">
            Finish the vault security update
          </h1>
          <p>
            {error instanceof Error
              ? error.message
              : 'Unable to remove old vault data.'}
          </p>
          <button
            className="rounded-lg border px-4 py-2"
            type="button"
            onClick={() => void start()}
          >
            Try again
          </button>
        </main>
      )
    })
void start()
