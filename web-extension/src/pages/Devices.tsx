import { Avatar, Box, Flex, Stat, Text, Icon } from '@chakra-ui/react'
import React from 'react'
import { IoIosPhonePortrait } from 'react-icons/io'

let devices = [
  { name: 'test', lastIp: '123', location: 'Brno' },
  { name: 'test', lastIp: '123', location: 'Brno' }
]

export default function Devices() {
  return (
    <>
      {devices.map((i) => {
        return (
          <Box boxShadow="2xl" p="5" rounded="md" bg="white">
            <Stat>
              <Flex justify="flex-start" align="center" flexDirection="row">
                <Icon as={IoIosPhonePortrait} w={20} h={20} />
                <Flex flexDirection="column" ml="5px" fontSize="md">
                  <Text>{i.name}</Text>
                  <Text>{i.lastIp}</Text>
                  <Text>Location: {i.location}</Text>
                </Flex>
              </Flex>
            </Stat>
          </Box>
        )
      })}
    </>
  )
}
