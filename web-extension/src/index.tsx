import * as Sentry from '@sentry/browser'

import ReactDOM from 'react-dom/client'
import browser from 'webextension-polyfill'
import { ApolloProvider } from '@apollo/client'
import { apolloClient } from './apollo/apolloClient'
import { ColorModeScript } from '@chakra-ui/react'
import { chakraRawTheme } from '@shared/chakraRawTheme'
import { ExtensionProviders } from './ExtensionProviders'
import PopupRoutes from './PopupRoutes'

Sentry.init({
  dsn: 'https://528d6bfc04eb436faea6046afc419f56@o997539.ingest.sentry.io/5955889'
})

let popupRoot: ReactDOM.Root
export const renderPopup = () => {
  popupRoot.render(
    <ApolloProvider client={apolloClient}>
      <ColorModeScript
        initialColorMode={chakraRawTheme.config?.initialColorMode}
      />
      <ExtensionProviders>
        <PopupRoutes />
      </ExtensionProviders>
    </ApolloProvider>
  )
}

const createRoot = () => {
  popupRoot = ReactDOM.createRoot(
    document.getElementById('popup') as HTMLElement
  )
  renderPopup()
}

browser.tabs.query({ active: true, currentWindow: true }).then(() => {
  //WARNING: https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded_event#checking_whether_loading_is_already_complete
  //Did not work in Firefox
  if (document.readyState === 'loading') {
    //Loading hasn't finished yet
    document.addEventListener('DOMContentLoaded', createRoot)
  } else {
    //`DOMContentLoaded` has already fired
    createRoot()
  }
})
