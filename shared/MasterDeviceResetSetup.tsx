import { useState } from 'react'
import {
  masterDeviceResetConfigSchema,
  type MasterDeviceResetConfig
} from './masterDeviceResetConfig'

const inputClass =
  'w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-400/50'

export function MasterDeviceResetSetup({
  initialConfig,
  email,
  onSave,
  onBack,
  busy = false,
  submitLabel = 'Create account'
}: {
  initialConfig: MasterDeviceResetConfig
  email: string
  onSave: (config: MasterDeviceResetConfig) => void | Promise<void>
  onBack?: () => void
  busy?: boolean
  submitLabel?: string
}) {
  const [approvals, setApprovals] = useState(initialConfig.requiredApprovals)
  const [wait, setWait] = useState(initialConfig.waitMinutes / 60)
  const [unit, setUnit] = useState(60)
  const [emails, setEmails] = useState(initialConfig.notificationEmails)
  const [error, setError] = useState('')
  const waitMinutes = wait * unit
  return (
    <form
      className="space-y-6"
      onSubmit={async (event) => {
        event.preventDefault()
        const result = masterDeviceResetConfigSchema.safeParse({
          requiredApprovals: approvals,
          waitMinutes,
          notificationEmails: emails.filter((value) => value.trim())
        })
        if (!result.success) {
          setError(
            result.error.issues[0]?.message ?? 'Check your recovery settings'
          )
          return
        }
        setError('')
        await onSave(result.data)
      }}
    >
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-400">
          Account recovery
        </p>
        <h2 className="text-2xl font-semibold">
          Plan for a lost master device
        </h2>
        <p className="mt-3 text-sm leading-6 text-[color:var(--color-muted)]">
          Choose what must happen before a new device can replace your master
          device. You’ll still need your vault password.
        </p>
      </div>
      <fieldset disabled={busy} className="space-y-4">
        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-5">
          <label htmlFor="reset-approvals" className="block font-medium">
            1. Approval from other devices
          </label>
          <p className="mb-3 mt-1 text-xs leading-5 text-[color:var(--color-muted)]">
            Only devices you already have can approve. Each device counts once.
          </p>
          <div className="flex items-center gap-3">
            <input
              id="reset-approvals"
              className={`${inputClass} max-w-24`}
              type="number"
              min={0}
              max={10}
              step={1}
              required
              value={Number.isNaN(approvals) ? '' : approvals}
              onChange={(event) => setApprovals(event.target.valueAsNumber)}
            />
            <span className="text-sm text-[color:var(--color-muted)]">
              devices · 0–10
            </span>
          </div>
          <p className="mt-3 text-xs leading-5 text-amber-300">
            {approvals === 0
              ? 'No device approval required. Recovery relies on your email, waiting period and vault password.'
              : `Keep at least ${Number.isFinite(approvals) ? approvals : 1} other device(s) available. Without them, this reset cannot complete.`}
          </p>
        </div>
        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] p-5">
          <label htmlFor="reset-wait" className="block font-medium">
            2. Waiting period
          </label>
          <p className="mb-3 mt-1 text-xs leading-5 text-[color:var(--color-muted)]">
            Starts when you confirm the email. Gives you time to cancel an
            unexpected request.
          </p>
          <div className="flex gap-3">
            <input
              id="reset-wait"
              className={inputClass}
              type="number"
              min={5 / unit}
              max={129600 / unit}
              step="any"
              required
              value={Number.isNaN(wait) ? '' : wait}
              onChange={(event) => setWait(event.target.valueAsNumber)}
            />
            <select
              aria-label="Waiting period unit"
              className={inputClass}
              value={unit}
              onChange={(event) => {
                const next = Number(event.target.value)
                setWait(waitMinutes / next)
                setUnit(next)
              }}
            >
              <option value={1}>Minutes</option>
              <option value={60}>Hours</option>
              <option value={1440}>Days</option>
            </select>
          </div>
          <p className="mt-2 text-xs text-[color:var(--color-muted)]">
            5 minutes to 3 months (90 days). Both safeguards must be satisfied.
          </p>
        </div>
        <div className="rounded-2xl border border-[color:var(--color-border)] p-5">
          <h3 className="font-medium">Keep your other inboxes informed</h3>
          <p className="mt-1 text-xs leading-5 text-[color:var(--color-muted)]">
            Updates go to {email || 'your account email'} and every address
            below. The confirmation link goes only to your account email.
          </p>
          <div className="mt-3 space-y-2">
            {emails.map((address, index) => (
              <div key={index} className="flex gap-2">
                <input
                  aria-label={`Notification email ${index + 1}`}
                  type="email"
                  maxLength={254}
                  className={inputClass}
                  placeholder="another@example.com"
                  value={address}
                  onChange={(event) =>
                    setEmails(
                      emails.map((value, i) =>
                        i === index ? event.target.value : value
                      )
                    )
                  }
                />
                <button
                  aria-label={`Remove email ${index + 1}`}
                  type="button"
                  className="px-2 text-sm text-[color:var(--color-muted)]"
                  onClick={() =>
                    setEmails(emails.filter((_, i) => i !== index))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={emails.length >= 20}
            className="mt-3 text-sm font-medium text-teal-400"
            onClick={() => setEmails([...emails, ''])}
          >
            + Add email address
          </button>
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        {onBack && (
          <button
            disabled={busy}
            type="button"
            className="rounded-xl border border-[color:var(--color-border)] px-5 py-3 text-sm"
            onClick={onBack}
          >
            Back
          </button>
        )}
        <button
          disabled={busy}
          type="submit"
          className="flex-1 rounded-xl bg-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
        >
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
