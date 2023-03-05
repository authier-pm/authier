import { createTsForm, useTsController } from '@ts-react/form'
import { z } from 'zod'
import { FormControl, FormErrorMessage, Input } from '@chakra-ui/react'

function TextField() {
  const {
    field: { onChange, value },
    error
  } = useTsController<string>()

  const isError = error?.errorMessage !== undefined
  console.log('isError', isError, error?.errorMessage)
  return (
    <FormControl isInvalid={isError}>
      <Input
        onChange={(e) => onChange(e.target.value)}
        value={value ? value : ''}
      />
      {error && <FormErrorMessage>{error.errorMessage}</FormErrorMessage>}
    </FormControl>
  )
}

function NumberField({ req }: { req: number }) {
  const {
    field: { onChange, value },
    error
  } = useTsController<number>()
  return (
    <>
      <span>
        <span>{`req is ${req}`}</span>
        <input
          value={value !== undefined ? value + '' : ''}
          onChange={(e) => {
            const value = parseInt(e.target.value)
            if (isNaN(value)) onChange(undefined)
            else onChange(value)
          }}
        />
        {error && error.errorMessage}
      </span>
    </>
  )
}

function CheckBoxField({ name }: { name: string }) {
  const {
    field: { onChange, value }
  } = useTsController<boolean>()

  return (
    <label>
      {name}
      <input
        onChange={(e) => onChange(e.target.checked)}
        checked={value ? value : false}
        type="checkbox"
      />
    </label>
  )
}

// create the mapping
const mapping = [
  [z.string(), TextField],
  [z.boolean(), CheckBoxField],
  [z.number(), NumberField]
] as const // 👈 `as const` is necessary

// A typesafe React component
export const MyForm = createTsForm(mapping)
