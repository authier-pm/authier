import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { initializeTheme } from './lib/theme'
import { VaultSessionProvider } from './providers/VaultSessionProvider'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false
    }
  }
})

initializeTheme()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <VaultSessionProvider>
        <App />
      </VaultSessionProvider>
    </QueryClientProvider>
  </BrowserRouter>
)
