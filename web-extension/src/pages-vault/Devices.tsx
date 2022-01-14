import {
  ArrowForwardIcon,
  ChevronDownIcon,
  SettingsIcon,
  StarIcon
} from '@chakra-ui/icons'
import {
  Heading,
  Avatar,
  Box,
  Center,
  Text,
  Stack,
  Button,
  Link,
  Badge,
  useColorModeValue,
  Icon,
  IconButton,
  Flex,
  Input,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Menu,
  MenuButton,
  MenuItem,
  MenuList
} from '@chakra-ui/react'
import { t } from '@lingui/macro'
import { useMyDevicesQuery } from '@src/pages/Devices.codegen'
import React, { useState } from 'react'
import { IoIosPhonePortrait } from 'react-icons/io'

const ListItem = (item: {
  id: string
  firstIpAddress: string
  lastIpAddress: string
  name: string
  lastGeoLocation: string
}) => {
  return (
    <Flex py={6}>
      <Box
        maxW={'380px'}
        w={'full'}
        bg={useColorModeValue('white', 'gray.900')}
        boxShadow={'2xl'}
        rounded={'lg'}
        p={6}
      >
        <Flex flexDirection={'row'} justifyContent={'space-between'}>
          <Icon as={IoIosPhonePortrait} size={'xl'} w={20} h={20} />

          <Stack
            direction={'row'}
            spacing={3}
            alignItems={'baseline'}
            lineHeight={'6'}
          >
            <Badge height="min-content" colorScheme="red">
              Master
            </Badge>
            <Badge height="min-content" colorScheme="green">
              Online
            </Badge>

            <Menu>
              <MenuButton
                as={IconButton}
                size="xs"
                variant="unstyled"
                aria-label="Favourite"
                fontSize="15px"
                icon={<SettingsIcon color="ButtonShadow" />}
              />
              <MenuList>
                <MenuItem>Deauth</MenuItem>
                <MenuItem>Remove</MenuItem>
              </MenuList>
            </Menu>
          </Stack>
        </Flex>
        <Stack mt={6} spacing={4}>
          <Heading fontSize={'xl'} fontFamily={'body'}>
            {item.name}
          </Heading>

          <Box>
            <Text fontWeight={600} color={'gray.500'} fontSize={'md'}>
              IP Address
            </Text>
            <Text fontSize={'2xl'}>{item.lastIpAddress}</Text>
          </Box>

          <Box>
            <Text fontWeight={600} color={'gray.500'} fontSize={'md'}>
              Geolocation
            </Text>
            <Text fontSize={'2xl'}>{item.lastGeoLocation}</Text>
          </Box>
        </Stack>
      </Box>
    </Flex>
  )
}

export default function Devices() {
  const { data, loading, error } = useMyDevicesQuery()
  const [filterBy, setFilterBy] = useState('')

  return (
    <Flex flexDirection="column">
      <Input
        w={['300px', '350px', '400px', '500px']}
        placeholder={t`Search for device`}
        m="auto"
        onChange={(ev) => {
          setFilterBy(ev.target.value)
        }}
      />

      <Center justifyContent={['flex-end', 'center', 'center']}>
        <Flex flexDirection="column">
          <Flex flexDirection="row" flexWrap="wrap" m="auto">
            {data?.me?.devices
              ?.filter(({ name }) => {
                return name.includes(filterBy)
              })
              .map((el, i) => {
                return <ListItem {...el} key={i} />
              })}
          </Flex>
        </Flex>
      </Center>
    </Flex>
  )
}
