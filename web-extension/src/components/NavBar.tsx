import React, {
  createContext,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useEffect,
  useState
} from 'react'

import browser from 'webextension-polyfill'

import { Flex, Text, IconButton } from '@chakra-ui/react'
import { HamburgerIcon, ArrowBackIcon } from '@chakra-ui/icons'

import { Link, useRoute, useLocation, LinkProps, LocationHook } from 'wouter'

export const NavBar: FunctionComponent = () => {
  const [isOut, setIsOut] = useState(false)
  const [location, setLocation] = useLocation()
  const [lastPage, SetLastPage] = useState<string>('/')

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
    SetLastPage(location)
  }, [])

  return (
    <Flex
      height="40px"
      textAlign="center"
      backgroundColor="whitesmoke"
      fontSize="16px"
      borderBottom="1px"
      borderBottomColor="gray.300"
      width="330px"
    >
      <ActiveLink href={!isOut ? '/menu' : lastPage}>
        {location !== '/' ? (
          <IconButton
            size="md"
            aria-label="menu"
            icon={<ArrowBackIcon />}
            onClick={() => {
              setIsOut(!isOut)
            }}
          />
        ) : (
          <IconButton
            size="md"
            aria-label="menu"
            icon={<HamburgerIcon />}
            onClick={() => {
              setIsOut(!isOut)
            }}
          />
        )}
      </ActiveLink>
    </Flex>
  )
}
