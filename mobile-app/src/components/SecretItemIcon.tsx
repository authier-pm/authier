import { Icon, Image, useColorModeValue } from 'native-base'
import { constructURL } from '@src/utils/urlUtils'
import React from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'
import FastImage from 'react-native-fast-image'

//TODO: Icons are flickering during fast scrolling
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
      // <Image
      //   fallbackElement={FallbackElement}
      //   src={props.iconUrl as string}
      //   maxW="50px"
      //   alt={props.iconUrl}
      //   boxSize="50px"
      // />
      <FastImage
        style={{ width: 50, height: 50 }}
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
        // <Image
        //   background={'white'}
        //   source={{
        //     uri: `https://icons.duckduckgo.com/ip3/${hostname}.ico` // https://stackoverflow.com/a/10796141
        //   }}
        //   fallbackElement={FallbackElement}
        //   ignoreFallback
        //   alt={hostname}
        //   maxW="50px"
        //   boxSize="50px"
        // />
        <FastImage
          style={{ width: 50, height: 50, backgroundColor: 'white' }}
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
