import { useId } from 'react'
import { FiAlertTriangle } from 'react-icons/fi'
import { isClockSkewWarning } from '@src/util/clockSkew'
import { useClockSkew } from '@src/util/useClockSkew'

export function ClockSkewWarning() {
  const sample = useClockSkew()
  const titleId = useId()

  if (!sample || !isClockSkewWarning(sample)) return null

  const seconds = Math.round(Math.abs(sample.offsetMs) / 1000)
  const direction = sample.offsetMs > 0 ? 'ahead of' : 'behind'

  return (
    <div
      aria-labelledby={titleId}
      className="mx-2 my-2 flex shrink-0 gap-2.5 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-[color:var(--color-foreground)]"
      role="alert"
    >
      <FiAlertTriangle
        aria-hidden
        className="mt-0.5 size-4 shrink-0 text-amber-400"
      />
      <div className="min-w-0 space-y-1.5 leading-relaxed">
        <p className="font-semibold" id={titleId}>
          Check your device clock
        </p>
        <p>
          Your device clock was approximately {seconds} seconds {direction} the
          server at the last sync. TOTP codes may be rejected.
        </p>
        <p className="text-[color:var(--color-muted)]">
          Enable automatic date and time in your device settings, then sync
          Authier again.
        </p>
      </div>
    </div>
  )
}
