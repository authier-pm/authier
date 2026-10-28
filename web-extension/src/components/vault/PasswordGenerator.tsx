import { useId, useState } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import {
  type IPasswordGeneratorConfig,
  defaultPasswordGeneratorConfig,
  generate
} from '@shared/passwordGenerator'
import { Button } from '@src/components/ui/button'
import { Input } from '@src/components/ui/input'

const characterGroups = [
  { name: 'uppercase', label: 'Uppercase', example: 'A–Z' },
  { name: 'lowercase', label: 'Lowercase', example: 'a–z' },
  { name: 'numbers', label: 'Numbers', example: '0–9' },
  { name: 'symbols', label: 'Symbols', example: '!@#' }
] as const

const minimumLength = 5
const maximumLength = 128

export const PasswordGenerator = ({
  isOpen,
  onGenerate
}: {
  isOpen: boolean
  onGenerate: (password: string) => void
}) => {
  const [config, setConfig] = useState<IPasswordGeneratorConfig>(
    defaultPasswordGeneratorConfig
  )
  const [length, setLength] = useState(String(config.length))
  const id = useId()
  const parsedLength = Number(length)
  const invalidLength =
    !Number.isInteger(parsedLength) ||
    parsedLength < minimumLength ||
    parsedLength > maximumLength
  let error: string | undefined

  if (invalidLength) {
    error = `Choose a length between ${minimumLength} and ${maximumLength}.`
  } else if (!characterGroups.some(({ name }) => config[name])) {
    error = 'Select at least one character type.'
  }

  const generatePassword = () => {
    if (!error) onGenerate(generate({ ...config, length: parsedLength }))
  }

  if (!isOpen) return null

  return (
    <fieldset
      className="space-y-4 rounded-xl border border-border/60 bg-background/40 p-4"
      onKeyDown={(event) => {
        if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
          event.preventDefault()
          generatePassword()
        }
      }}
    >
      <legend className="sr-only">Password generator</legend>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium">Password generator</span>
        <Button
          className="rounded-[var(--radius-sm)] border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
          disabled={Boolean(error)}
          onClick={generatePassword}
          size="sm"
          type="button"
          variant="outline"
        >
          <FiRefreshCw aria-hidden className="size-3.5" />
          Generate password
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs text-muted" htmlFor={`${id}-length`}>
          Length
        </label>
        <input
          aria-label="Password length slider"
          className="h-1.5 min-w-12 flex-1 cursor-pointer accent-primary"
          max={maximumLength}
          min={minimumLength}
          onChange={(event) => setLength(event.target.value)}
          type="range"
          value={Math.min(
            maximumLength,
            Math.max(minimumLength, Number(length) || minimumLength)
          )}
        />
        <Input
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={invalidLength}
          className="h-8 w-16 rounded-[var(--radius-sm)] px-2 text-center tabular-nums"
          id={`${id}-length`}
          max={maximumLength}
          min={minimumLength}
          onChange={(event) => setLength(event.target.value)}
          step={1}
          type="number"
          value={length}
        />
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-3">
        {characterGroups.map(({ name, label, example }) => (
          <GeneratorToggle
            checked={config[name]}
            example={example}
            key={name}
            label={label}
            onChange={(checked) => {
              setConfig((current) => ({ ...current, [name]: checked }))
            }}
          />
        ))}
      </div>
      {error && (
        <p className="text-xs text-danger" id={`${id}-error`} role="status">
          {error}
        </p>
      )}
    </fieldset>
  )
}

function GeneratorToggle({
  checked,
  example,
  label,
  onChange
}: {
  checked: boolean
  example: string
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs">
      <input
        aria-label={label}
        checked={checked}
        className="size-3.5 accent-primary"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>{label}</span>
      <span aria-hidden className="font-mono text-muted">
        {example}
      </span>
    </label>
  )
}
