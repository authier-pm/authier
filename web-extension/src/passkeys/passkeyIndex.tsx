import ReactDOM from 'react-dom/client'
import browser from 'webextension-polyfill'
import '@src/index.css'
import { PasskeyApproval } from './PasskeyApproval'
import type {
  PasskeyApprovalAction,
  PasskeyApprovalReply
} from './passkeyApprovalTypes'

const root = ReactDOM.createRoot(document.getElementById('passkey')!)
document.documentElement.dataset.theme = 'dark'
const token = new URLSearchParams(location.search).get('request') ?? ''
const send = (action: PasskeyApprovalAction): Promise<PasskeyApprovalReply> =>
  browser.runtime.sendMessage(action)

void send({ kind: 'authierPasskeyView', token }).then(
  (reply) => {
    if (reply.status === 'ready') {
      root.render(<PasskeyApproval initialView={reply.view} onAction={send} />)
      // Keep a pending MV3 ceremony alive while its trusted approval window is open.
      const timer = setInterval(() => {
        void send({ kind: 'authierPasskeyView', token }).then(
          (status) => {
            if (status.status === 'error') {
              clearInterval(timer)
              root.render(<p className="p-6">{status.message}</p>)
            }
          },
          () => {
            clearInterval(timer)
            root.render(
              <p className="p-6">
                This request has expired. Please try again on the website.
              </p>
            )
          }
        )
      }, 15_000)
      window.addEventListener('pagehide', () => clearInterval(timer), {
        once: true
      })
    } else {
      root.render(
        <p className="p-6">
          This request has expired. Please try again on the website.
        </p>
      )
    }
  },
  () =>
    root.render(
      <p className="p-6">
        Authier is unavailable. Please try again on the website.
      </p>
    )
)
