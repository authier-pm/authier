import { useColorModeValue, Flex, Select } from '@chakra-ui/react'
import React, { useState } from 'react'

import { motion } from 'framer-motion'

import { AddLogin } from '@src/components/vault/addItem/AddLogin'
import { AddTOTP } from '@src/components/vault/addItem/AddTOTP'

export const AddItem = () => {
  const [type, setType] = useState('Login')

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
        width={{ base: '90%', sm: '70%', md: '50%' }}
        flexDirection="column"
        boxShadow={'2xl'}
        rounded={'md'}
        overflow={'hidden'}
        m="auto"
        alignItems={'center'}
        bg={useColorModeValue('white', 'gray.800')}
      >
        <Select
          onChange={(e) => setType(e.target.value)}
          defaultValue={'Login'}
          placeholder="Select type"
          w={'50%'}
          mt={5}
        >
          <option value="TOTP">TOTP</option>
          <option value="Login">Login</option>
        </Select>

        {type === 'Login' ? <AddLogin /> : <AddTOTP />}
      </Flex>
    </motion.div>
  )
}
