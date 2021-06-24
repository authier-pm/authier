import React, {
  createContext,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useEffect,
  useState
} from 'react'

import { browser } from 'webextension-polyfill-ts'

import { Flex, Text, IconButton } from '@chakra-ui/react'
import { HamburgerIcon } from '@chakra-ui/icons'

import { Link, useRoute } from 'wouter'

export const NavBar: FunctionComponent = () => {
  const [inSettings, SetInSettings] = useState(true)

  const ActiveLink = (props) => {
    const [isActive] = useRoute(props.href)

    return (
      <Link {...props}>
        <a className={isActive ? 'active' : ''}>{props.children}</a>
      </Link>
    )
  }
  console.log(inSettings)
  return (
    <Flex
      height="38px"
      textAlign="center"
      backgroundColor="whitesmoke"
      fontSize="16px"
      borderBottom="1px"
      borderBottomColor="gray.300"
      width={300}
    >
      <ActiveLink href={inSettings ? '/settings' : '/'}>
        <IconButton
          m="5px"
          size="sm"
          aria-label="Settings"
          icon={<HamburgerIcon />}
          onClick={() => SetInSettings(!inSettings)}
        />
      </ActiveLink>
    </Flex>
  )
}
