import {
  Flex,
  Box,
  Stack,
  Heading,
  Text,
  useColorModeValue
} from '@chakra-ui/react'
import { Formik } from 'formik'
import React from 'react'
import { Link } from './Link'
import { InputControl, SubmitButton } from 'formik-chakra-ui'
import { t } from '@lingui/macro'

export function LoginCard() {
  return (
    <Flex
      minH={'100vh'}
      align={'center'}
      justify={'center'}
      bg={useColorModeValue('gray.50', 'gray.800')}
    >
      <Stack spacing={8} mx={'auto'} maxW={'lg'} py={12} px={6}>
        <Stack align={'center'}>
          <Heading fontSize={'4xl'}>Sign in to your vault</Heading>
          <Text fontSize={'lg'} color={'gray.600'}>
            to enjoy all of our cool <Link href="/features">features</Link> ✌️
          </Text>
        </Stack>
        <Box
          rounded={'lg'}
          bg={useColorModeValue('white', 'gray.700')}
          boxShadow={'lg'}
          p={8}
        >
          <Formik
            initialValues={{ password: '', username: '' }}
            onSubmit={async (data) => {
              console.log(data)
            }}
          >
            {({ handleSubmit }) => {
              return (
                <form onSubmit={handleSubmit}>
                  <Stack spacing={4}>
                    <InputControl name="username" label={t`Username`} />
                    <InputControl
                      name="password"
                      label={t`Password`}
                      inputProps={{ type: 'password', autoComplete: 'off' }}
                    />
                    <Stack spacing={10}>
                      <Stack
                        direction={{ base: 'column', sm: 'row' }}
                        align={'start'}
                        justify={'space-between'}
                      >
                        {/* <CheckboxControl
                        name="remember"
                        label={t`Remember me`}
                        value={}
                      ></CheckboxControl> */}
                      </Stack>
                      <SubmitButton
                        bg={'blue.400'}
                        color={'white'}
                        _hover={{
                          bg: 'blue.500'
                        }}
                      >
                        Sign in
                      </SubmitButton>
                    </Stack>
                  </Stack>
                </form>
              )
            }}
          </Formik>
        </Box>
      </Stack>
    </Flex>
  )
}
