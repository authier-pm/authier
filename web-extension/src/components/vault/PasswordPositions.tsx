import { t } from '@lingui/core/macro'
import { TbListNumbers } from 'react-icons/tb'
import { Button } from '@src/components/ui/button'
import { Tooltip } from '@src/components/ui/tooltip'

export function PasswordPositionsButton({
  expanded,
  panelId,
  onClick,
  withLabel = false
}: {
  expanded: boolean
  panelId: string
  onClick: () => void
  withLabel?: boolean
}) {
  const label = expanded
    ? t`Hide password positions`
    : t`Show password positions`
  const button = (
    <Button
      aria-controls={expanded ? panelId : undefined}
      aria-expanded={expanded}
      aria-label={label}
      className="aria-expanded:border-primary aria-expanded:text-primary"
      onClick={onClick}
      size={withLabel ? 'sm' : 'icon'}
      type="button"
      variant="outline"
    >
      <TbListNumbers aria-hidden="true" className="size-4" />
      {withLabel ? label : null}
    </Button>
  )

  if (withLabel) return button

  return (
    <Tooltip className="left-auto right-0 translate-x-0" content={label}>
      {button}
    </Tooltip>
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
