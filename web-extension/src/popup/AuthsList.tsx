import React, { useContext } from 'react'
import {
  Avatar,
  Box,
  Flex,
  Stat,
  StatLabel,
  StatNumber
} from '@chakra-ui/react'
import { authenticator } from 'otplib'
import { AuthsContext } from './Popup'

export const AuthsList: React.FC<{}> = () => {
  const { auths } = useContext(AuthsContext)

  return (
    <>
      {auths.map((oauth) => {
        return (
          <Box boxShadow="2xl" p="4" rounded="md" bg="white">
            <Stat>
              <Flex justify="flex-start">
                <Avatar src={oauth.icon}></Avatar>
                <Box ml={4}>
                  <StatLabel>{oauth.label}</StatLabel>
                  <StatNumber>
                    {authenticator.generate(oauth.secret)}
                  </StatNumber>
                </Box>
              </Flex>
            </Stat>
          </Box>
        )
      })}
    </>
  )
}
