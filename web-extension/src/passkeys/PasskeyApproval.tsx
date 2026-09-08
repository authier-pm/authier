import { useState } from 'react'
import { TbKey, TbLock, TbWorld } from 'react-icons/tb'
import { Button } from '@src/components/ui/button'
import { Input } from '@src/components/ui/input'
import type {
  PasskeyApprovalAction,
  PasskeyApprovalReply,
  PasskeyApprovalView
} from './passkeyApprovalTypes'

type Props = {
  initialView: PasskeyApprovalView
  onAction(action: PasskeyApprovalAction): Promise<PasskeyApprovalReply>
}

function PasskeyAccounts({
  view,
  selected,
  onSelect
}: {
  view: PasskeyApprovalView
  selected: string
  onSelect(credentialId: string): void
}) {
  if (view.operation === 'create') {
    return (
      <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-4">
        <p className="text-xs text-[color:var(--color-muted)]">Account</p>
        <p className="mt-1 break-all font-medium">{view.accountName}</p>
      </div>
    )
  }
  if (!view.accounts.length)
    return (
      <p role="status" className="text-sm text-[color:var(--color-muted)]">
        No matching passkeys in this vault. Sync your vault and try again, or
        use another provider.
      </p>
    )
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium">Choose an account</legend>
      {view.accounts.map((account) => (
        <label
          key={account.credentialId}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-3"
        >
          <input
            type="radio"
            name="passkey"
            value={account.credentialId}
            checked={selected === account.credentialId}
            onChange={() => onSelect(account.credentialId)}
          />
          <span className="min-w-0">
            <span className="block break-all font-medium">
              {account.userName}
            </span>
            <span className="block break-all text-xs text-[color:var(--color-muted)]">
              {account.userDisplayName}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  )
}

export function PasskeyApproval({ initialView, onAction }: Props) {
  const [view, setView] = useState(initialView)
  const [password, setPassword] = useState('')
  const [selected, setSelected] = useState(
    initialView.accounts[0]?.credentialId ?? ''
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const creating = view.operation === 'create'
  const canApprove = creating || Boolean(selected)
  let submitLabel = 'Continue'
  if (view.verified) submitLabel = creating ? 'Save passkey' : 'Sign in'
  if (busy) submitLabel = 'Please wait…'

  const act = async (action: PasskeyApprovalAction) => {
    setBusy(true)
    setError('')
    // The browser can close a window or suspend a worker while a ceremony is open.
    try {
      const response = await onAction(action)
      if (response.status === 'ready') {
        setView(response.view)
        setSelected(response.view.accounts[0]?.credentialId ?? '')
      } else if (response.status === 'error') {
        setError(response.message)
        if (action.kind === 'authierPasskeyApprove')
          setView((current) => ({ ...current, verified: false }))
      } else {
        setDone(true)
      }
    } catch {
      setError(
        'This request is no longer available. Please try again on the website.'
      )
    } finally {
      setPassword('')
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-[440px] bg-[color:var(--color-background)] px-6 py-6 text-[color:var(--color-foreground)]">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <TbLock className="size-5 text-[color:var(--color-primary)]" /> Authier{' '}
        <span className="ml-auto text-xs font-normal text-[color:var(--color-muted)]">
          Passkeys
        </span>
      </div>
      <div className="mb-5 mt-7 flex size-14 items-center justify-center rounded-2xl bg-[color:var(--color-accent)]">
        <TbKey className="size-8 text-[color:var(--color-primary)]" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">
        {creating ? 'Save a passkey in Authier' : 'Sign in with Authier'}
      </h1>
      <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
        {creating
          ? 'Keep this passkey in your encrypted vault and use it across your browsers.'
          : 'Use a passkey from your encrypted vault to sign in to this website.'}
      </p>
      <div className="my-5 flex items-start gap-2 rounded-xl border border-[color:var(--color-border)] p-3">
        <TbWorld className="mt-0.5 size-5 shrink-0 text-[color:var(--color-muted)]" />
        <div className="min-w-0">
          <p className="break-all text-sm font-medium">{view.origin}</p>
          <p className="mt-1 break-all text-xs text-[color:var(--color-muted)]">
            Passkey domain: {view.rpId}
          </p>
        </div>
      </div>
      {done ? (
        <p role="status">Continue in your browser.</p>
      ) : (
        <>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (busy) return
              if (view.verified)
                void act({
                  kind: 'authierPasskeyApprove',
                  token: view.token,
                  credentialId: selected || undefined
                })
              else
                void act({
                  kind: 'authierPasskeyVerify',
                  token: view.token,
                  password
                })
            }}
          >
            {view.verified ? (
              <PasskeyAccounts
                view={view}
                selected={selected}
                onSelect={setSelected}
              />
            ) : (
              <label className="block text-sm font-medium">
                Master password
                <Input
                  className="mt-2"
                  type="password"
                  autoComplete="current-password"
                  autoFocus
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <span className="mt-2 block text-xs font-normal leading-5 text-[color:var(--color-muted)]">
                  Verify it’s you before {creating ? 'saving' : 'using'} a
                  passkey.
                </span>
              </label>
            )}
            {error ? (
              <p
                role="alert"
                className="text-sm text-[color:var(--color-danger)]"
              >
                {error}
              </p>
            ) : null}
            <Button
              className="w-full"
              type="submit"
              disabled={busy || (view.verified ? !canApprove : !password)}
            >
              {submitLabel}
            </Button>
          </form>
          <Button
            className="mt-3 w-full"
            variant="outline"
            disabled={busy}
            onClick={() =>
              void act({
                kind: 'authierPasskeyDismiss',
                token: view.token,
                fallback: true
              })
            }
          >
            Use another provider
          </Button>
          <Button
            className="mt-1 w-full"
            variant="ghost"
            disabled={busy}
            onClick={() =>
              void act({
                kind: 'authierPasskeyDismiss',
                token: view.token,
                fallback: false
              })
            }
          >
            Cancel
          </Button>
          <p className="mt-5 text-center text-xs leading-5 text-[color:var(--color-muted)]">
            Encrypted in Authier. Available in Brave, Firefox and Edge after
            vault sync.
          </p>
        </>
      )}
    </main>
  )
}
