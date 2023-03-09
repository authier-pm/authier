import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react'
import { Trans } from '@lingui/react'
import { useTsController, useDescription } from '@ts-react/form'
import { useState } from 'react'

export function PasswordTextField() {
  const {
    field: { onChange, value },
    error
  } = useTsController<string>()
  const { label, placeholder } = useDescription()
  const [showNew, setShownNew] = useState(false)
  const isError = error?.errorMessage !== undefined

  return (
    <FormControl isInvalid={isError}>
      <FormLabel>
        {/* WARNING: What is this ID? */}
        <Trans id={label as string}>{label}</Trans>
      </FormLabel>

      <InputGroup size="md">
        <Input
          pr="4.5rem"
          type={showNew ? 'text' : 'password'}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          value={value ? value : ''}
        />
        <InputRightElement width="4.5rem">
          <Button h="1.75rem" size="sm" onClick={() => setShownNew(!showNew)}>
            {showNew ? 'Hide' : 'Show'}
          </Button>
        </InputRightElement>
      </InputGroup>
      {error && <FormErrorMessage>{error.errorMessage}</FormErrorMessage>}
    </FormControl>
  )
}
