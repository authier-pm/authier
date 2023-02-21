import {
  useColorModeValue,
  Flex,
  Select,
  Box,
  Text,
  Spinner,
  Link
} from '@chakra-ui/react'
import { useContext, useState } from 'react'

import { motion } from 'framer-motion'

import { AddLogin } from '@src/components/vault/addItem/AddLogin'
import { AddTOTP } from '@src/components/vault/addItem/AddTOTP'
import { useMeExtensionQuery } from './AccountLimits.codegen'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { Txt } from '@src/components/util/Txt'
import { Trans } from '@lingui/macro'
import { Link as RouterLink } from 'react-router-dom'

export const AddItem = () => {
  type secretType = 'login' | 'totp'
  const [type, setType] = useState<secretType>('login')
  const { loginCredentials: LoginCredentials, TOTPSecrets } =
    useContext(DeviceStateContext)
  const { data, loading } = useMeExtensionQuery()

  const bg = useColorModeValue('white', 'gray.800')

  if (loading) {
    return <Spinner />
  }
  const totpLimitReached = (data?.me.TOTPlimit ?? 0) <= TOTPSecrets.length
  const pswLimitReached =
    (data?.me.loginCredentialsLimit ?? 0) <= LoginCredentials.length

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
        {totpLimitReached || pswLimitReached ? (
          <Txt mt={10} fontSize={'lg'} color="yellow.600">
            <Trans>
              You have reached your account limit. Go to{' '}
              <Link as={RouterLink} to="/account-limits">
                {' '}
                Account Limits to upgrade your account.
              </Link>{' '}
            </Trans>
          </Txt>
        ) : null}
        <Select
          onChange={(e) => setType(e.target.value as secretType)}
          value={type}
          placeholder="Select type"
          w={'50%'}
          mt={5}
        >
          <option disabled={totpLimitReached} value="totp">
            TOTP
          </option>
          <option disabled={pswLimitReached} value="login">
            Login
          </option>
        </Select>

        {type === 'login' ? <AddLogin /> : type === 'totp' ? <AddTOTP /> : null}
      </Flex>
    </motion.div>
  )
}
