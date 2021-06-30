import React, { ReactElement, useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Text
} from '@chakra-ui/react'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { useRegisterMutation } from './Register.codegen'
import ErrorMessage from '@src/components/ErrorMessage'
import { Formik, Form, Field, FormikHelpers } from 'formik'

interface Values {
  password: string
  email: string
}

export default function Register(): ReactElement {
  const [showPassword, setShowPassword] = useState(false)
  const [register, { data, loading, error: registerError }] =
    useRegisterMutation()

  // if (loading) {
  //   return (
  //     <Box>
  //       <Text>Loading</Text>
  //     </Box>
  //   )
  // }

  return (
    // <Flex width="full" align="center" justifyContent="center">
    //   <Box
    //     p={8}
    //     maxWidth="500px"
    //     borderWidth={1}
    //     borderRadius={8}
    //     boxShadow="lg"
    //   >
    //     {isLoggedIn ? (
    //       <Box textAlign="center">
    //         <Text>{email} logged in!</Text>
    //         <Button
    //           variantColor="orange"
    //           variant="outline"
    //           width="full"
    //           mt={4}
    //           onClick={() => setIsLoggedIn(false)}
    //         >
    //           Sign out
    //         </Button>
    //       </Box>
    //     ) : (
    //       <>
    //         <Box textAlign="center">
    //           <Heading>Login</Heading>
    //         </Box>
    //         <Box my={4} textAlign="left">
    //           <form onSubmit={handleSubmit}>
    //             {error && <ErrorMessage message={error} />}
    //             <FormControl isRequired>
    //               <FormLabel>Email</FormLabel>
    //               <Input
    //                 type="email"
    //                 placeholder="test@test.com"
    //                 size="lg"
    //                 onChange={(event) => setEmail(event.currentTarget.value)}
    //               />
    //             </FormControl>
    //             <FormControl isRequired mt={6}>
    //               <FormLabel>Password</FormLabel>
    //               <InputGroup>
    //                 <Input
    //                   type={showPassword ? 'text' : 'password'}
    //                   placeholder="*******"
    //                   size="lg"
    //                   onChange={(event) =>
    //                     setPassword(event.currentTarget.value)
    //                   }
    //                 />
    //                 <InputRightElement width="3rem">
    //                   <Button
    //                     h="1.5rem"
    //                     size="sm"
    //                     onClick={handlePasswordVisibility}
    //                   >
    //                     {showPassword ? (
    //                       <Icon name="view-off" />
    //                     ) : (
    //                       <Icon name="view" />
    //                     )}
    //                   </Button>
    //                 </InputRightElement>
    //               </InputGroup>
    //             </FormControl>
    //             <Button
    //               variantColor="teal"
    //               variant="outline"
    //               type="submit"
    //               width="full"
    //               mt={4}
    //             >
    //               {isLoading ? (
    //                 <CircularProgress
    //                   isIndeterminate
    //                   size="24px"
    //                   color="teal"
    //                 />
    //               ) : (
    //                 'Sign In'
    //               )}
    //             </Button>
    //           </form>
    //         </Box>
    //       </>
    //     )}
    //   </Box>
    // </Flex>

    <Box p={8} maxWidth="500px" borderWidth={1} borderRadius={6} boxShadow="lg">
      <Formik
        initialValues={{ email: '', password: '' }}
        onSubmit={(
          values: Values,
          { setSubmitting }: FormikHelpers<Values>
        ) => {
          setTimeout(() => {
            alert(JSON.stringify(values, null, 2))
            setSubmitting(false)
          }, 1000)
        }}
      >
        {(props) => (
          <Form>
            <Field name="email">
              {({ field, form }: any) => (
                <FormControl
                  isInvalid={form.errors.email && form.touched.email}
                  isRequired
                >
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <Input {...field} id="Email" placeholder="bob@bob.com" />
                  <FormErrorMessage>{form.errors.email}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Field name="password">
              {({ field, form }: any) => (
                <FormControl
                  isInvalid={form.errors.password && form.touched.password}
                  isRequired
                >
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <InputGroup>
                    <Input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="*******"
                    />
                    <InputRightElement width="3rem">
                      <Button
                        h="1.5rem"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{form.errors.password}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
            <Button
              colorScheme="teal"
              variant="outline"
              type="submit"
              width="full"
              mt={4}
              isLoading={props.isSubmitting}
            >
              Register
            </Button>
          </Form>
        )}
      </Formik>
    </Box>
  )
}
