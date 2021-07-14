import { Avatar, Box, Flex, Stat, Text, Icon, Button } from '@chakra-ui/react'
import React from 'react'
import { IoIosPhonePortrait } from 'react-icons/io'
import { useLocation } from 'wouter'

let devices = [
  { name: 'test', lastIp: '25', location: 'Brno' },
  { name: 'test', lastIp: '123', location: 'Brno' }
]

export default function Devices() {
  const [location, setLocation] = useLocation()

  return (
    <Box>
      {devices.map((i) => {
        return (
          <Box key={i.lastIp} boxShadow="xl" p="5" bg="white" mb={2}>
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
      <Button
        onClick={() => {
          setLocation('/QRcode')
        }}
      >
        Add device
      </Button>
    </Box>
  )
}
