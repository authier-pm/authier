import {
  useColorModeValue,
  Flex,
  Select,
  Box,
  Text,
  Spinner
} from '@chakra-ui/react'
import { useContext, useState } from 'react'

import { motion } from 'framer-motion'

import { AddLogin } from '@src/components/vault/addItem/AddLogin'
import { AddTOTP } from '@src/components/vault/addItem/AddTOTP'
import { useMeExtensionQuery } from './AccountLimits.codegen'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'

export const AddItem = () => {
  type secretType = 'login' | 'totp'
  const [type, setType] = useState<secretType>('login')
  const { loginCredentials: LoginCredentials, TOTPSecrets } =
    useContext(DeviceStateContext)
  const { data, loading } = useMeExtensionQuery({
    fetchPolicy: 'network-only'
  })

  const bg = useColorModeValue('white', 'gray.800')

  if (loading) {
    return <Spinner />
  }
  const totpCond = data!.me.TOTPlimit <= TOTPSecrets.length
  const pswCond = data!.me.loginCredentialsLimit <= LoginCredentials.length

  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        width: '80%',
        display: 'contents'
      }}
    >
      <Flex
        width={{ base: '90%', sm: '70%', lg: '60%' }}
        flexDirection="column"
        boxShadow={'2xl'}
        rounded={'md'}
        overflow={'hidden'}
        m="auto"
        alignItems={'center'}
        bg={bg}
      >
        <Select
          onChange={(e) => setType(e.target.value as secretType)}
          value={type}
          placeholder="Select type"
          w={'50%'}
          mt={5}
        >
          <option disabled={totpCond} value="totp">
            TOTP
          </option>
          <option disabled={pswCond} value="login">
            Login
          </option>
        </Select>

        {type === 'login' ? <AddLogin /> : type === 'totp' ? <AddTOTP /> : null}
      </Flex>
    </motion.div>
  )
}
