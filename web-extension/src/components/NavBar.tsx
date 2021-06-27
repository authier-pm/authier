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

import {
  Link,
  useRoute,
  useLocation,
  useRouter,
  Router,
  LinkProps,
  LocationHook
} from 'wouter'

export const NavBar: FunctionComponent = () => {
  const [inSettings, SetInSettings] = useState(true)
  const [location, setLocation] = useLocation()
  const [lastPage, SetLastPage] = useState<string>('')

  const ActiveLink = (
    props: JSX.IntrinsicAttributes &
      React.PropsWithChildren<LinkProps<LocationHook>>
  ) => {
    const [isActive] = useRoute(props.href as string)

    return (
      <Link {...props}>
        <a className={isActive ? 'active' : ''}>{props.children}</a>
      </Link>
    )
  }

  useEffect(() => {
    if (inSettings) {
      SetLastPage(location)
    }
  })

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
      <ActiveLink href={inSettings ? '/settings' : lastPage}>
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
