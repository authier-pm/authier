import {
  Avatar,
  Box,
  Flex,
  Stat,
  Text,
  Icon,
  Button,
  Spinner
} from '@chakra-ui/react'
import { UserContext } from '@src/providers/UserProvider'
import React, { useContext } from 'react'
import { IoIosPhonePortrait } from 'react-icons/io'
import { useLocation } from 'wouter'
import { useMyDevicesQuery } from './Devices.codegen'

let devices = [
  { name: 'test', lastIp: '25', location: 'Brno' },
  { name: 'test', lastIp: '123', location: 'Brno' }
]

export default function Devices() {
  const [location, setLocation] = useLocation()
  const { userId } = useContext(UserContext)
  const { data, loading, error } = useMyDevicesQuery({
    variables: {
      userId: userId as string
    }
  })

  return (
    <Box>
      {data && !loading ? (
        data.myDevices.map((i) => {
          return (
            <Box key={i.lastIpAdress} boxShadow="xl" p="5" bg="white" mb={2}>
              <Stat>
                <Flex justify="flex-start" align="center" flexDirection="row">
                  <Icon as={IoIosPhonePortrait} w={20} h={20} />
                  <Flex flexDirection="column" ml="5px" fontSize="md">
                    <Text>{i.name}</Text>
                    <Text>{i.lastIpAdress}</Text>
                    <Text>Location: </Text>
                  </Flex>
                </Flex>
              </Stat>
            </Box>
          )
        })
      ) : (
        <Spinner />
      )}

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
