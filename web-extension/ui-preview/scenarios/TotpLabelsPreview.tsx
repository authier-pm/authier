import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { TbAuth2Fa, TbPhoto } from 'react-icons/tb'
import { formatTotpLabel } from '@shared/totpLabel'
import { Button } from '@src/components/ui/button'
import { Input } from '@src/components/ui/input'
import { TotpAccountForm } from '@src/components/pages/TotpAccountForm'
import { TotpLabelFields } from '@src/components/vault/addItem/TotpLabelFields'
import {
  readTotpPageEmail,
  observeTotpAccountEmail
} from '@src/content-script/totpAccountEmail'
import { handleTotpAccountEmailMessage } from '@src/background/totpAccountEmail'
import {
  resolveTotpAccountEmail,
  TotpEmailMessage
} from '@src/util/totpAccountEmail'
import { parseTotpProvisioning } from '@src/util/totpProvisioning'
import { getQrCodeFromUrl } from '@src/util/getQrCodeFromUrl'
import browser, {
  setPreviewMessageHandler,
  setPreviewTabMessageHandler
} from '../browserMock'

const exampleEmail = 'gael@frankobusiness.com'
const tab = {
  id: 17,
  index: 0,
  windowId: 1,
  active: true,
  highlighted: true,
  pinned: false,
  incognito: false
}

// Decode the rendered synthetic QR through the production image scanner.
const readRenderedQr = async () => {
  const svg = document.querySelector('[data-qr] svg')
  if (!svg) throw new Error('Preview QR is missing')
  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = image.width + 40
  canvas.height = image.height + 40
  const context = canvas.getContext('2d')!
  context.fillStyle = 'white'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 20, 20)
  const qr = await getQrCodeFromUrl(canvas.toDataURL())
  if (!qr) throw new Error('Preview QR could not be decoded')
  return parseTotpProvisioning(qr.data)
}

export const TotpLabelsPreview = () => {
  const source = new URLSearchParams(location.search).get('source') ?? 'page'
  const [entered, setEntered] = useState(source !== 'session')
  const [needsEmail, setNeedsEmail] = useState(false)
  const [saved, setSaved] = useState<{
    email: string
    provider: string
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const qrAccount = source === 'qr' ? `Microsoft:${exampleEmail}` : 'Microsoft'
  const qrData = `otpauth://totp/${encodeURIComponent(qrAccount)}?secret=JBSWY3DPEHPK3PXP&issuer=Microsoft`

  useEffect(() => {
    setPreviewMessageHandler((message) =>
      handleTotpAccountEmailMessage(message, {
        id: browser.runtime.id,
        url: browser.runtime.getURL('js/popup.html')
      })
    )
    setPreviewTabMessageHandler(() => readTotpPageEmail(document))
    const stop = observeTotpAccountEmail(document, (email) => {
      void handleTotpAccountEmailMessage(
        { kind: TotpEmailMessage.REPORT, email },
        {
          id: browser.runtime.id,
          url: 'https://login.microsoft.com/',
          tab,
          frameId: 0
        }
      )
    })
    return () => {
      stop()
      setPreviewMessageHandler(undefined)
      setPreviewTabMessageHandler(undefined)
    }
  }, [])

  const save = async (email: string, provider: string) => {
    formatTotpLabel(email, provider)
    setSaved({ email, provider })
    setNeedsEmail(false)
  }

  const renderImportContent = () => {
    if (saved)
      return (
        <>
          <p role="status" className="mb-5 text-sm text-emerald-400">
            TOTP added to your vault
          </p>
          <fieldset disabled>
            <TotpLabelFields
              email={saved.email}
              provider={saved.provider}
              onEmailChange={() => undefined}
              onProviderChange={() => undefined}
            />
          </fieldset>
        </>
      )
    if (needsEmail)
      return (
        <TotpAccountForm
          provider="Microsoft"
          onSave={save}
          onCancel={() => setNeedsEmail(false)}
        />
      )
    return (
      <Button
        variant="outline"
        disabled={busy || !entered}
        onClick={async () => {
          setBusy(true)
          try {
            const provisioning = await readRenderedQr()
            const email = await resolveTotpAccountEmail(
              provisioning.accountEmail,
              tab
            )
            if (email) await save(email, provisioning.provider)
            else setNeedsEmail(true)
          } finally {
            setBusy(false)
          }
        }}
      >
        <TbPhoto /> Add QR TOTP from current page
      </Button>
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-8" data-ui-preview>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-primary)]">
        Authier / Add an authenticator code
      </p>
      <h1 className="mt-3 mb-8 text-3xl font-semibold">
        Every code belongs to an account.
      </h1>
      <div className="grid items-start gap-8 md:grid-cols-[1fr_350px]">
        <section
          className="rounded-xl bg-white p-8 text-[#333] shadow-xl"
          data-preview-page
        >
          <h2 className="text-2xl font-semibold">Microsoft</h2>
          {source === 'page' ? (
            <p className="mt-5 text-sm">{exampleEmail}</p>
          ) : null}
          {entered ? (
            <>
              <h3 className="mt-6 text-2xl font-semibold">Scan the QR code</h3>
              <div className="my-8 flex justify-center" data-qr>
                <QRCode value={qrData} size={220} />
              </div>
              <p className="text-sm leading-relaxed">
                Use your authenticator app to scan the QR code. This connects
                the app to your account.
              </p>
            </>
          ) : (
            <form
              className="mt-8 grid gap-5"
              onSubmit={(event) => {
                event.preventDefault()
                setEntered(true)
              }}
            >
              <label className="grid gap-2">
                Email
                <Input type="email" required />
              </label>
              <Button type="submit">Continue to setup</Button>
            </form>
          )}
        </section>
        <section className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-5 shadow-xl">
          <div className="mb-5 flex items-center gap-2 font-semibold">
            <TbAuth2Fa className="size-6 text-[color:var(--color-primary)]" />{' '}
            Authier
          </div>
          {renderImportContent()}
        </section>
      </div>
    </main>
  )
}
