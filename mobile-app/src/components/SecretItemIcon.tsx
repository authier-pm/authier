import { constructURL } from '@src/utils/urlUtils'
import { Avatar, Icon } from 'native-base'
import React from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'

export function SecretItemIcon(props: {
  iconUrl: string | null | undefined
  url: string
}) {
  let hostname

  if (props.url) {
    hostname = getHostnameFromUrl(props)
  } else {
    hostname = ''
  }

  return (
    <>
      {hostname.search('android') !== -1 ? (
        <Icon
          as={<Ionicons name={'lock-closed-outline'} />}
          size={5}
          mr="2"
          color="muted.400"
        />
      ) : (
        <Avatar
          background={'white'}
          source={{
            uri: props.iconUrl
              ? props.iconUrl
              : `https://icons.duckduckgo.com/ip3/${hostname}.ico` // https://stackoverflow.com/a/10796141}
          }}
          size="lg"
        />
      )}
    </>
  )
}

function getHostnameFromUrl(props: {
  iconUrl: string | null | undefined
  url: string
}): string {
  try {
    const hostname = constructURL(props.url).hostname
    return hostname
  } catch (err) {
    return props.url
  }
}
