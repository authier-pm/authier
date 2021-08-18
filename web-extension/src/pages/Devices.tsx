import {
  Avatar,
  Box,
  Flex,
  Stat,
  Text,
  Icon,
  Button,
  Spinner,
  IconButton,
  Tooltip
} from '@chakra-ui/react'
import { DeleteIcon, StarIcon } from '@chakra-ui/icons'
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
        data.user.myDevices.map((i) => {
          return (
            <Flex
              key={i.lastIpAdress}
              boxShadow="xl"
              bg="white"
              m={2}
              pb={2}
              flexDirection="column"
              borderWidth="5px"
            >
              <Flex justifyContent="flex-end" mr={2}>
                <Tooltip hasArrow label="Main device" fontSize="sm">
                  <IconButton
                    size="xs"
                    variant="unstyled"
                    aria-label="Main device"
                    fontSize="17px"
                    icon={<StarIcon color="gold" />}
                  />
                </Tooltip>
                <Tooltip hasArrow label="Remove device" fontSize="sm">
                  <IconButton
                    size="xs"
                    variant="unstyled"
                    aria-label="Remove device"
                    fontSize="17px"
                    icon={<DeleteIcon />}
                  />
                </Tooltip>
              </Flex>
              <Flex justify="flex-start" align="center" flexDirection="row">
                <Icon as={IoIosPhonePortrait} w={20} h={20} />
                <Flex flexDirection="column" ml="5px" fontSize="md">
                  <Text>{i.name}</Text>
                  <Text>{i.lastIpAdress}</Text>
                  <Text>Location: </Text>
                </Flex>
              </Flex>
            </Flex>
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
