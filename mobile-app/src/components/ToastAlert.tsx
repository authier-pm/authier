import React from 'react'
import { VStack, HStack, Alert, Text } from 'native-base'

export const ToastAlert = ({
  status,
  variant,
  title,
  description,
  ...rest
}) => {
  return (
    <Alert
      maxWidth="90%"
      alignSelf="center"
      flexDirection="row"
      status={status ?? 'info'}
      variant={variant}
      {...rest}
    >
      <VStack space={1} flexShrink={1} w="100%">
        <HStack
          flexShrink={1}
          alignItems="center"
          justifyContent="space-between"
        >
          <HStack space={2} flexShrink={1} alignItems="center">
            <Alert.Icon />
            <Text
              fontSize="md"
              fontWeight="medium"
              flexShrink={1}
              color={
                variant === 'solid'
                  ? 'lightText'
                  : variant !== 'outline'
                  ? 'darkText'
                  : null
              }
            >
              {title}
            </Text>
          </HStack>
        </HStack>
        <Text
          px="6"
          color={
            variant === 'solid'
              ? 'lightText'
              : variant !== 'outline'
              ? 'darkText'
              : null
          }
        >
          {description}
        </Text>
      </VStack>
    </Alert>
  )
}
