import { useTsController, useDescription } from '@ts-react/form'
import { FormControl, Input, Stack } from 'native-base'
import { Trans } from '@lingui/react'

export function TextField() {
  const {
    field: { onChange, value },
    error
  } = useTsController<string>()
  const { label, placeholder } = useDescription()

  const isError = error?.errorMessage !== undefined

  return (
    <FormControl isInvalid={isError}>
      <FormControl.Label>
        <Trans id={label as string}>{label}</Trans>
      </FormControl.Label>

      <Stack space={4} w="100%" alignItems="center">
        <Input
          isRequired
          value={value ? value : ''}
          onChangeText={(e) => onChange(e)}
          w={{
            base: '75%',
            md: '25%'
          }}
          placeholder={placeholder}
        />
      </Stack>
      {error && (
        <FormControl.ErrorMessage>
          {error.errorMessage}
        </FormControl.ErrorMessage>
      )}
    </FormControl>
  )
}
