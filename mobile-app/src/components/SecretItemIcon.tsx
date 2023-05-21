import { Icon, useColorModeValue } from 'native-base'
import { constructURL } from '@src/utils/urlUtils'
import React from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'
import FastImage from 'react-native-fast-image'

export function SecretItemIcon(props: {
  iconUrl: string | null | undefined
  url: string
}) {
  const color = useColorModeValue('black', 'white')
  const FallbackElement = (
    <Icon
      as={<Ionicons color={'white'} name={'lock-closed-outline'} />}
      size={10}
      alignSelf="center"
      color={color}
    />
  )

  let hostname
  if (props.iconUrl) {
    return (
      <FastImage
        style={{ width: 50, height: 50, borderRadius: 10 }}
        source={{
          uri: props.iconUrl as string,
          priority: FastImage.priority.normal
        }}
        resizeMode={FastImage.resizeMode.contain}
      />
    )
  }

  if (props.url) {
    try {
      hostname = constructURL(props.url).hostname

      return (
        <FastImage
          style={{ width: 50, height: 50, borderRadius: 10 }}
          source={{
            uri: `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
            priority: FastImage.priority.normal
          }}
          resizeMode={FastImage.resizeMode.contain}
        />
      )
    } catch (err) {
      return FallbackElement
    }
  } else {
    return FallbackElement
  }
}
