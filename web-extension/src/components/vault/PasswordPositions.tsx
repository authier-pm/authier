import { t } from '@lingui/core/macro'
import { TbListNumbers } from 'react-icons/tb'
import { Button } from '@src/components/ui/button'

export function PasswordPositionsButton({
  expanded,
  panelId,
  onClick
}: {
  expanded: boolean
  panelId: string
  onClick: () => void
}) {
  const label = expanded
    ? t`Hide password positions`
    : t`Show password positions`

  return (
    <Button
      aria-controls={expanded ? panelId : undefined}
      aria-expanded={expanded}
      className="aria-expanded:border-primary aria-expanded:text-primary"
      onClick={onClick}
      size="sm"
      type="button"
      variant="outline"
    >
      <TbListNumbers aria-hidden="true" className="size-4" />
      {label}
    </Button>
  )
}

export function PasswordPositions({
  id,
  password
}: {
  id: string
  password: string
}) {
  return (
    <ol
      aria-label={t`Password positions`}
      className="grid grid-cols-[repeat(auto-fill,minmax(2.125rem,1fr))] gap-1.5"
      dir="ltr"
      id={id}
      role="list"
    >
      {Array.from(password, (character, index) => (
        <li
          className="rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-card)] py-1 text-center"
          key={index}
        >
          <span className="block text-xs text-[color:var(--color-muted)] tabular-nums">
            {index + 1}
          </span>
          <bdi className="block font-mono text-base leading-5 whitespace-pre">
            {character === ' ' ? (
              <span className="font-sans text-[0.625rem]">{t`Space`}</span>
            ) : (
              character
            )}
          </bdi>
        </li>
      ))}
    </ol>
  )
}
