import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { copyTextToClipboard } from '@/lib/clipboard'
import { cn } from '@/lib/cn'
import { formatTotpToken, generateTotpToken, getTotpRemainingSeconds } from '@/lib/totp'

type TotpCodeCardProps = {
  digits: number
  label: string
  period: number
  secret: string
}

export function TotpCodeCard({
  digits,
  label,
  period,
  secret
}: TotpCodeCardProps) {
  const [now, setNow] = useState(() => Date.now())
  const [token, setToken] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    let isCancelled = false

    void generateTotpToken({
      secret,
      digits,
      period,
      now
    }).then((nextToken) => {
      if (!isCancelled) {
        setToken(nextToken)
      }
    })

    return () => {
      isCancelled = true
    }
  }, [digits, now, period, secret])

  useEffect(() => {
    setIsCopied(false)
  }, [token])

  useEffect(() => {
    if (!isCopied) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setIsCopied(false)
    }, 1500)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isCopied])

  const remainingSeconds = getTotpRemainingSeconds(period, now)
  const formattedToken = token === null ? 'Invalid TOTP secret' : formatTotpToken(token)
  const displayLabel = label.trim() || 'This item'
  const canCopy = token !== null
  let helperText = `Expires in ${remainingSeconds}s. Click the token to copy it.`

  if (!canCopy) {
    helperText = `Use a valid base32 secret to generate the ${digits}-digit code.`
  } else if (isCopied) {
    helperText = 'Copied to clipboard.'
  }

  const handleCopy = () => {
    if (!canCopy) {
      return
    }

    void copyTextToClipboard(token).then(() => {
      setIsCopied(true)
    }, () => {
      setIsCopied(false)
    })
  }

  return (
    <Card className="border-white/10 bg-[color:var(--color-surface)] backdrop-blur-[14px]">
      <CardHeader>
        <CardTitle>Current token</CardTitle>
        <CardDescription>
          {displayLabel} refreshes every {period} seconds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <button
          aria-disabled={!canCopy}
          className={cn(
            'block w-full rounded-[var(--radius-lg)] border border-white/10 bg-[color:var(--color-surface-muted)] px-5 py-4 text-left transition-colors',
            canCopy
              ? 'cursor-copy hover:bg-[color:var(--color-accent)]/35'
              : 'cursor-default'
          )}
          onClick={handleCopy}
          type="button"
        >
          <p className="font-mono text-3xl font-semibold tracking-[0.3em] sm:text-4xl">
            {formattedToken}
          </p>
        </button>
        <p className="text-sm text-[color:var(--color-muted)]">{helperText}</p>
      </CardContent>
    </Card>
  )
}
