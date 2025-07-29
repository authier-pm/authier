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
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiShield, FiShieldOff, FiAlertTriangle } from 'react-icons/fi'
import { Txt } from '@src/components/util/Txt'
import { UserNewDevicePolicy } from '../../../shared/generated/graphqlBaseTypes'

export const NewDevicePolicyOnboarding = () => {
  const [selectedPolicy, setSelectedPolicy] =
    useState<UserNewDevicePolicy | null>(null)
  const [updateNewDevicePolicy, { loading, error }] =
    useUpdateNewDevicePolicyMutation()
  const navigate = useNavigate()

  const { data: userData, loading: userLoading } =
    useGetUserNewDevicePolicyQuery({
      fetchPolicy: 'network-only'
    })

  const handleSubmit = async () => {
    if (selectedPolicy) {
      try {
        await updateNewDevicePolicy({
          variables: { newDevicePolicy: selectedPolicy }
        })
        navigate('/')
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
      <Box p={8} borderWidth={1} borderRadius={8} boxShadow="lg" bg="white">
        <Heading mb={6}>New Device Policy</Heading>
        <Text mb={6}>Please select how you want to handle new devices.</Text>
        <FormControl as="fieldset">
          <FormLabel as="legend">Policy Options</FormLabel>
          <RadioGroup
            onChange={(value) =>
              setSelectedPolicy(value as UserNewDevicePolicy)
            }
            value={selectedPolicy as string}
          >
            <Stack spacing={3}>
              <Radio value={UserNewDevicePolicy.ALLOW}>
                <HStack spacing={2}>
                  <Icon as={FiShieldOff} color="orange.500" />
                  <Text>Allow any new device</Text>
                </HStack>
              </Radio>
              <Radio value={UserNewDevicePolicy.REQUIRE_ANY_DEVICE_APPROVAL}>
                <HStack spacing={2}>
                  <Icon as={FiAlertTriangle} color="yellow.500" />
                  <Text>Require Any Device Approval</Text>
                </HStack>
              </Radio>
              <Radio
                disabled
                value={UserNewDevicePolicy.REQUIRE_MASTER_DEVICE_APPROVAL}
              >
                <HStack spacing={2}>
                  <Icon as={FiShield} color="green.500" />
                  <Text>Require Master Device Approval</Text>
                </HStack>
              </Radio>
            </Stack>
          </RadioGroup>
        </FormControl>
        <Txt mt={4} fontSize="sm" color="gray.500">
          Note: The &quot;Require Master Device Approval&quot; option is
          currently disabled. This feature will be available in a future update
          when it is possible to reset your master device.
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
