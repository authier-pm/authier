import React, {
  createContext,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useEffect,
  useState
} from 'react'

import browser from 'webextension-polyfill'

import { Flex, Text, IconButton, useDisclosure } from '@chakra-ui/react'
import { HamburgerIcon, ArrowBackIcon, CloseIcon } from '@chakra-ui/icons'

import { Link, useRoute, useLocation, LinkProps, LocationHook } from 'wouter'
import { Menu } from '@src/pages/Menu'

export const NavBar: FunctionComponent = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [location, setLocation] = useLocation()
  console.log('~ location', location)
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
    <Flex flexDir="column">
      <Flex
        height="40px"
        textAlign="center"
        backgroundColor="whitesmoke"
        fontSize="16px"
        borderBottom="1px"
        borderBottomColor="gray.300"
        width="330px"
      >
        {isOpen ? (
          <IconButton
            size="md"
            aria-label="menu"
            icon={<CloseIcon />}
            onClick={() => {
              onClose()
            }}
          />
        ) : (
          <IconButton
            size="md"
            aria-label="menu"
            icon={<HamburgerIcon />}
            onClick={() => {
              onOpen()
            }}
          />
        )}
      </Flex>

      {isOpen && <Menu></Menu>}
    </Flex>
  )
}
