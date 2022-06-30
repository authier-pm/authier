import React from 'react'
import { Image } from '@chakra-ui/react'
import { BiFileBlank } from 'react-icons/bi'

export function SecretItemIcon(props: {
  iconUrl: string | null | undefined
  url: string
}) {
  let hostname
  try {
    hostname = new URL(props.url).hostname
  } catch (err) {
    return <BiFileBlank></BiFileBlank>
  }

  return (
    <Image
      src={
        (props.iconUrl as string) ??
        `https://icons.duckduckgo.com/ip3/${hostname}.ico` // https://stackoverflow.com/a/10796141
      }
      maxW="30px"
      boxSize="30px"
    ></Image>
  )
}
