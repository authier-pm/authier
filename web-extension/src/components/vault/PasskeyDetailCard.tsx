import { useId, useState, type ReactNode } from 'react'
import type { PasskeyData } from '@shared/passkeySchema'
import { FiKey, FiShield } from 'react-icons/fi'
import { Button } from '@src/components/ui/button'
import { Input } from '@src/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@src/components/ui/card'

type PasskeyMetadata = Pick<
  PasskeyData,
  'label' | 'rpId' | 'userName' | 'userDisplayName' | 'createdAt'
>

export const PasskeyDetailCard = ({
  passkey,
  onSaveLabel,
  children
}: {
  passkey: PasskeyMetadata
  onSaveLabel: (label: string) => Promise<void>
  children?: ReactNode
}) => {
  const [savedLabel, setSavedLabel] = useState(passkey.label)

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-[color:var(--color-accent)] text-[color:var(--color-primary)]">
          <FiKey className="size-6" />
        </div>
        <div className="text-xs tracking-widest text-[color:var(--color-muted)] uppercase">
          Passkey
        </div>
        <CardTitle>{savedLabel}</CardTitle>
        <CardDescription>
          Sign in with the same passkey in every browser connected to your
          Authier vault.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <PasskeyLabelForm
          label={savedLabel}
          onSave={async (label) => {
            await onSaveLabel(label)
            setSavedLabel(label)
          }}
        />
        <dl className="space-y-3">
          <Metadata label="Website" value={passkey.rpId} />
          <Metadata label="Account" value={passkey.userName} />
          <Metadata label="Name" value={passkey.userDisplayName} />
          <Metadata
            label="Created"
            value={new Date(passkey.createdAt).toLocaleDateString()}
          />
        </dl>
        <div className="flex gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm leading-6">
          <FiShield className="mt-1 size-5 shrink-0 text-emerald-400" />
          <p>
            This passkey is encrypted in your vault. Authier asks you to approve
            each sign-in. Install the Authier extension and unlock the same
            vault to use it in another browser.
          </p>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function PasskeyLabelForm({
  label,
  onSave
}: {
  label: string
  onSave: (label: string) => Promise<void>
}) {
  const inputId = useId()
  const [value, setValue] = useState(label)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const nextLabel = value.trim()

  return (
    <form
      className="space-y-2"
      onSubmit={async (event) => {
        event.preventDefault()
        if (saving || !nextLabel || nextLabel === label) return
        setSaving(true)
        setError('')
        setSaved(false)
        // Keep edits available for retry when encryption or sync fails.
        try {
          await onSave(nextLabel)
          setValue(nextLabel)
          setSaved(true)
        } catch (error) {
          setError(
            error instanceof Error ? error.message : 'Could not save label.'
          )
        } finally {
          setSaving(false)
        }
      }}
    >
      <label className="text-sm font-medium" htmlFor={inputId}>
        Label
      </label>
      <div className="flex flex-wrap gap-2">
        <Input
          className="min-w-48 flex-1"
          disabled={saving}
          id={inputId}
          onChange={(event) => {
            setValue(event.target.value)
            setSaved(false)
            setError('')
          }}
          required
          value={value}
        />
        <Button
          disabled={saving || !nextLabel || nextLabel === label}
          size="sm"
          type="submit"
        >
          {saving ? 'Saving…' : 'Save label'}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-[color:var(--color-danger)]" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-sm text-[color:var(--color-primary)]" role="status">
          Label saved
        </p>
      )}
    </form>
  )
}

const Metadata = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4 border-b border-[color:var(--color-border)] py-2 text-sm">
    <dt className="text-[color:var(--color-muted)]">{label}</dt>
    <dd className="break-all text-right font-medium">{value}</dd>
  </div>
)
