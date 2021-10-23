import {
  Heading,
  VStack,
  FormControl,
  Input,
  Button,
  View,
  Text
} from 'native-base'
import React from 'react'

export function Register({ navigation }) {
  console.log('register')
  return (
    <View safeArea flex={1} p="2" w="90%" mx="auto" justifyContent="center">
      <Heading size="lg" fontWeight="600" color="coolGray.800">
        Welcome
      </Heading>
      <Heading mt="1" color="coolGray.600" fontWeight="medium" size="xs">
        Create an account to continue!
      </Heading>

      <VStack space={3} mt="5">
        <FormControl>
          <FormControl.Label
            _text={{
              color: 'coolGray.800',
              fontSize: 'xl',
              fontWeight: 500
            }}
          >
            Email:
          </FormControl.Label>
          <Input />
        </FormControl>
        <FormControl>
          <FormControl.Label
            _text={{
              color: 'coolGray.800',
              fontSize: 'xl',
              fontWeight: 500
            }}
          >
            Password:
          </FormControl.Label>
          <Input type="password" />
        </FormControl>
        <FormControl>
          <FormControl.Label
            _text={{
              color: 'coolGray.800',
              fontSize: 'xl',
              fontWeight: 500
            }}
          >
            Confirm password:
          </FormControl.Label>
          <Input type="password" />
        </FormControl>
        <Button mt="2" colorScheme="indigo" _text={{ color: 'white' }}>
          Create an account
        </Button>
        <Button
          onPress={() => {
            navigation.goBack()
          }}
        >
          Sign Up
        </Button>
      </VStack>
    </View>
  )
}
