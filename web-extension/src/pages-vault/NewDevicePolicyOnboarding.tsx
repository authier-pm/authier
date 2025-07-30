import {
  Box,
  Button,
  Center,
  FormControl,
  FormLabel,
  Heading,
  Radio,
  RadioGroup,
  Stack,
  Text,
  Icon,
  HStack
} from '@chakra-ui/react'
import {
  useUpdateNewDevicePolicyMutation,
  useGetUserNewDevicePolicyQuery
} from './NewDevicePolicyOnboarding.codegen'
import { useState } from 'react'
import { FiShieldOff, FiAlertTriangle } from 'react-icons/fi'
import { Txt } from '@src/components/util/Txt'
import { UserNewDevicePolicy } from '../../../shared/generated/graphqlBaseTypes'

export const NewDevicePolicyOnboarding = () => {
  const [selectedPolicy, setSelectedPolicy] =
    useState<UserNewDevicePolicy | null>(null)
  const [updateNewDevicePolicy, { loading, error }] =
    useUpdateNewDevicePolicyMutation()

  const {
    data: userData,
    loading: userLoading,
    refetch
  } = useGetUserNewDevicePolicyQuery({
    fetchPolicy: 'network-only'
  })

  const handleSubmit = async () => {
    if (selectedPolicy) {
      try {
        await updateNewDevicePolicy({
          variables: { newDevicePolicy: selectedPolicy }
        })
        refetch()
      } catch (e) {
        console.error(e)
      }
    }
  }

  if (userLoading) {
    return null
  }

  if (userData?.me?.newDevicePolicy !== null) {
    return null
  }

  return (
    <Center
      h="100vh"
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0,0,0,0.5)"
      zIndex={9999}
    >
      <Box p={8} borderWidth={1} borderRadius={8} boxShadow="lg" bg="gray.50">
        <Heading mb={6} color="gray.800">
          New Device Policy
        </Heading>
        <Text mb={6} color="gray.700" fontSize={'md'}>
          Please select how you want to handle new devices. You can change this
          later in the settings.
        </Text>
        <FormControl as="fieldset">
          <FormLabel as="legend" color="gray.800">
            Policy Options
          </FormLabel>
          <RadioGroup
            onChange={(value) =>
              setSelectedPolicy(value as UserNewDevicePolicy)
            }
            value={selectedPolicy as string}
          >
            <Stack spacing={3}>
              <Radio
                value={UserNewDevicePolicy.ALLOW}
                colorScheme="blue"
                borderColor="gray.400"
              >
                <HStack spacing={2}>
                  <Icon as={FiShieldOff} color="orange.500" />
                  <Text color="gray.800">Allow any new device</Text>
                  <Text color="gray.500">
                    You will be notified when a new device logged in.
                  </Text>
                </HStack>
              </Radio>
              <Radio
                value={UserNewDevicePolicy.REQUIRE_ANY_DEVICE_APPROVAL}
                colorScheme="blue"
                borderColor="gray.400"
              >
                <HStack spacing={2}>
                  <Icon as={FiAlertTriangle} color="yellow.500" />
                  <Text color="gray.800">Require Any Device Approval</Text>
                  <Text color="gray.500">
                    You will be notified when a new device logged in and you
                    need to approve it from another device.
                  </Text>
                </HStack>
              </Radio>
              {/* <Radio
                disabled
                value={UserNewDevicePolicy.REQUIRE_MASTER_DEVICE_APPROVAL}
                colorScheme="gray"
                borderColor="gray.300"
              >
                <HStack spacing={2}>
                  <Icon as={FiShield} color="green.500" />
                  <Text color="gray.600">Require Master Device Approval</Text>
                </HStack>
              </Radio> */}
            </Stack>
          </RadioGroup>
        </FormControl>
        <Txt mt={4} fontSize="sm" color="gray.600">
          Note: The &quot;Require Master Device Approval&quot; option is
          currently not available. This feature will be available in a future
          update when it is possible to reset your master device.
        </Txt>
        {error && <Text color="red.500">{error.message}</Text>}
        <Button
          mt={6}
          colorScheme="blue"
          onClick={handleSubmit}
          isLoading={loading}
          isDisabled={!selectedPolicy}
        >
          Save
        </Button>
      </Box>
    </Center>
  )
}
