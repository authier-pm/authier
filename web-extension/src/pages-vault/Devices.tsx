import { ArrowForwardIcon, SettingsIcon } from '@chakra-ui/icons'
import {
  Heading,
  Avatar,
  Box,
  Center,
  Text,
  Stack,
  Badge,
  useColorModeValue,
  Icon,
  IconButton,
  Flex,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spinner,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Checkbox,
  Select,
  Button
} from '@chakra-ui/react'
import { t } from '@lingui/macro'
import { useMyDevicesQuery } from '@src/pages/Devices.codegen'
import { Formik, FormikHelpers, Field } from 'formik'
import React, { useState } from 'react'
import { IoIosPhonePortrait } from 'react-icons/io'

interface configValues {
  lockTime: number
  twoFA: boolean
}

const vaultLockTimeOptions = [
  { value: 0, label: 'On web close' },
  { value: 10000, label: '10 seconds' },
  { value: 288000000, label: '8 hours' },
  { value: 432000000, label: '12 hours' }
]

const ListItem = (item: {
  id: string
  firstIpAddress: string
  lastIpAddress: string
  name: string
  lastGeoLocation: string
  logoutAt?: string | null | undefined
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  return (
    <Flex py={6} m={5}>
      <Box
        maxW={'380px'}
        w={'full'}
        bg={useColorModeValue('white', 'gray.900')}
        boxShadow={'2xl'}
        rounded={'lg'}
        p={6}
      >
        <Flex flexDirection={'row'} justifyContent={'space-between'}>
          <Icon as={IoIosPhonePortrait} w={20} h={20} />

          <Stack
            direction={'row'}
            spacing={3}
            alignItems={'baseline'}
            lineHeight={'6'}
          >
            <Badge height="min-content" colorScheme="purple">
              Master
            </Badge>
            {item.logoutAt ? (
              <Badge height="min-content" colorScheme="red">
                Offline
              </Badge>
            ) : (
              <Badge height="min-content" colorScheme="green">
                Online
              </Badge>
            )}

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

                <MenuItem onClick={() => setIsConfigOpen(!isConfigOpen)}>
                  Config
                </MenuItem>

                <MenuItem>Remove</MenuItem>
              </MenuList>
            </Menu>
          </Stack>
        </Flex>

        <Heading fontSize={'xl'} fontFamily={'body'}>
          {item.name}
        </Heading>

        {isConfigOpen ? (
          <Box mt={5}>
            <Formik
              initialValues={{
                lockTime: 0,
                twoFA: false
              }}
              onSubmit={async (
                values: configValues,
                { setSubmitting }: FormikHelpers<configValues>
              ) => {
                console.log(values)
                setSubmitting(false)
              }}
            >
              <Stack spacing={3}>
                <Field name="lockTime">
                  {({ form }) => (
                    <FormControl
                      isInvalid={form.errors.lockTime && form.touched.lockTime}
                    >
                      <FormLabel htmlFor="lockTime">Safe lock time</FormLabel>
                      <Select
                        name="lockTime"
                        id="lockTime"
                        defaultValue={vaultLockTimeOptions[0].label}
                      >
                        {vaultLockTimeOptions.map((i) => (
                          <option key={i.value} value={i.value}>
                            {i.label}
                          </option>
                        ))}
                      </Select>
                      <FormErrorMessage>
                        {form.errors.lockTime}
                      </FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="TwoFA">
                  {({ field, form }) => (
                    <FormControl
                      isInvalid={form.errors.name && form.touched.name}
                    >
                      <Checkbox id="TwoFA" {...field}>
                        2FA
                      </Checkbox>

                      <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Flex justifyContent={'flex-end'}>
                  <Button
                    type="submit"
                    size={'sm'}
                    bg={'blue.400'}
                    color={'white'}
                    boxShadow={
                      '0px 1px 25px -5px rgb(66 153 225 / 48%), 0 10px 10px -5px rgb(66 153 225 / 43%)'
                    }
                    _hover={{
                      bg: 'blue.500'
                    }}
                    _focus={{
                      bg: 'blue.500'
                    }}
                    aria-label="Save"
                    rightIcon={<ArrowForwardIcon />}
                  >
                    Save
                  </Button>
                </Flex>
              </Stack>
            </Formik>
          </Box>
        ) : (
          <Stack mt={6} spacing={4}>
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
        )}
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
            {loading ? (
              <Center pt={5}>
                <Spinner size="lg" />
              </Center>
            ) : (
              data?.me?.devices
                ?.filter(({ name }) => {
                  return name.includes(filterBy)
                })
                .map((el, i) => {
                  return <ListItem {...el} key={i} />
                })
            )}
          </Flex>
        </Flex>
      </Center>
    </Flex>
  )
}
