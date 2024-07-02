import * as Sentry from '@sentry/browser'
import ReactDOM from 'react-dom/client'
import browser from 'webextension-polyfill'

import { apolloCache } from './apollo/apolloClient'
import { HashRouter } from 'react-router-dom'
import { ColorModeScript } from '@chakra-ui/react'
import { chakraRawTheme } from '../../shared/chakraRawTheme'
import { ExtensionProviders } from './ExtensionProviders'
import { VaultRouter } from './pages-vault/VaultRouter'
import { QueryParamProvider } from 'use-query-params'
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6'
import { LocalStorageWrapper, persistCache } from 'apollo3-cache-persist'

Sentry.init({
  dsn: 'https://528d6bfc04eb436faea6046afc419f56@o997539.ingest.sentry.io/5955889'
})

let vaultRoot: ReactDOM.Root
export const renderVault = () => {
  vaultRoot.render(
    <HashRouter basename="/">
      <QueryParamProvider adapter={ReactRouter6Adapter}>
          <ColorModeScript
            initialColorMode={chakraRawTheme.config?.initialColorMode}
          />
          <ExtensionProviders>
            <VaultRouter />
          </ExtensionProviders>
      </QueryParamProvider>
    </HashRouter>
  )
}

browser.tabs.query({ active: true, currentWindow: true }).then(async () => {
  const div = document.getElementById('vault') as HTMLElement
  vaultRoot = ReactDOM.createRoot(div)

  div.style.overflow = 'hidden' // needed to prevent extra scrollbar on the right
  div.style.height = '100vh'
  await persistCache({
    cache: apolloCache,
    storage: new LocalStorageWrapper(window.localStorage)
  })
  renderVault()
})
