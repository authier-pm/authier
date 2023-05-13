import React from 'react'
import { Image } from '@chakra-ui/react'
import { BiFileBlank } from 'react-icons/bi'
import { constructURL } from '@shared/urlUtils'

export function SecretItemIcon(props: {
  iconUrl: string | null | undefined
  url?: string | null | undefined
}) {
  let hostname
  if (props.iconUrl) {
    return (
      <Image src={props.iconUrl as string} maxW="30px" boxSize="30px"></Image>
    )
  }
  if (props.url) {
    try {
      hostname = constructURL(props.url).hostname

      return (
        <Image
          src={
            `https://icons.duckduckgo.com/ip3/${hostname}.ico` // https://stackoverflow.com/a/10796141
          }
          maxW="30px"
          boxSize="30px"
        ></Image>
      )
    } catch (err) {
      return <BiFileBlank></BiFileBlank>
    }
  }
  return <BiFileBlank></BiFileBlank>
}
