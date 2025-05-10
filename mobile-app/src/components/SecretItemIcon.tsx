import { Icon, useColorModeValue } from 'native-base'
import { constructURL } from '../utils/urlUtils'
import React from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'
import FastImage from 'react-native-fast-image'

export function SecretItemIcon(props: {
  iconUrl: string | null | undefined
  url: string
}) {
  const [fallback, setFallback] = React.useState(false)
  const color = useColorModeValue('black', 'gray.500')
  const FallbackElement = () => (
    <Icon
      as={<Ionicons color={'white'} name={'globe-outline'} />}
      size={10}
      alignSelf="center"
      color={color}
    />
  )

  if (fallback) {
    return <FallbackElement />
  }

  let hostname
  if (props.iconUrl) {
    console.log('no url')
    return (
      <FastImage
        style={{ overflow: 'visible', width: 50, height: 50, borderRadius: 10 }}
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
          style={{
            width: 50,
            height: 50,
            borderRadius: 10,
            overflow: 'visible'
          }}
          source={{
            uri: `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
            priority: FastImage.priority.normal
          }}
          resizeMode={FastImage.resizeMode.contain}
          fallback={true}
          onError={() => {
            setFallback(true)
          }}
        />
      )
    } catch (err) {
      return <FallbackElement />
    }
  } else {
    return <FallbackElement />
  }
}
