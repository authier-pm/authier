import { Trans } from '@lingui/react'
import { useTsController, useDescription } from '@ts-react/form'
import { FormControl, Icon, Input, Pressable, Stack } from 'native-base'
import { useState } from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'

export function PasswordTextField() {
  const {
    field: { onChange, value },
    error
  } = useTsController<string>()
  const { label, placeholder } = useDescription()
  const [show, setShow] = useState(false)
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
          type={show ? 'text' : 'password'}
          InputRightElement={
            <Pressable onPress={() => setShow(!show)}>
              <Icon
                as={
                  <Ionicons name={show ? 'eye-outline' : 'eye-off-outline'} />
                }
                size={5}
                mr="2"
                color="muted.400"
              />
            </Pressable>
          }
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
