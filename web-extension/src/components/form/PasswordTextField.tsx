import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react'
import { t } from '@lingui/macro'
import { Trans } from '@lingui/react'
import { useTsController, useDescription } from '@ts-react/form'
import { useState } from 'react'

export function PasswordTextField() {
  const {
    field: { onChange, value },
    error
  } = useTsController<string>()
  const { label, placeholder } = useDescription()
  const [showPassword, setShowPassword] = useState(false)
  const isError = error?.errorMessage !== undefined

  return (
    <FormControl isInvalid={isError}>
      <FormLabel>
        <Trans id={label as string}>{label}</Trans>
      </FormLabel>

      <InputGroup size="md">
        <Input
          required
          pr="4.5rem"
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          value={value ? value : ''}
        />
        <InputRightElement width="4.5rem">
          <Button
            h="1.75rem"
            size="sm"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <ViewOffIcon /> : <ViewIcon />}
          </Button>
        </InputRightElement>
      </InputGroup>
      {error && <FormErrorMessage>{error.errorMessage}</FormErrorMessage>}
    </FormControl>
  )
}
