import { Center, Text } from '@chakra-ui/react'
import { ILoginCredentials } from '@src/util/useBackgroundState'
import React from 'react'
import { useParams } from 'react-router-dom'

export const Item = ({ data }: any) => {
  console.log(data)
  return (
    <Center>
      <Text>{data.label}</Text>
    </Center>
  )
}
