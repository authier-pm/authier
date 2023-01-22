import React, { FunctionComponent, useEffect, useState } from 'react'

import {
  Flex,
  IconButton,
  useDisclosure,
  Box,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon, LockIcon } from '@chakra-ui/icons'

import { Link, useRoute, useLocation, LinkProps, LocationHook } from 'wouter'
import { NavMenu } from '@src/pages/NavMenu'
import { UserNavMenu } from '@src/pages/UserNavMenu'
import { IoIosListBox, IoMdArchive } from 'react-icons/io'
import { t } from '@lingui/macro'
import { RefreshSecretsButton } from './RefreshSecretsButton'

export const NavBar: FunctionComponent = () => {
  const {
    isOpen: isNavMenuOpen,
    onOpen: onNavMenuOpen,
    onClose: onNavMenuClose
  } = useDisclosure()
  const {
    isOpen: isUserMenuOpen,
    onOpen: onUserMenuOpen,
    onClose: onUserMenuClose
  } = useDisclosure()
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

  const bg = useColorModeValue('gray.100', 'gray.800')

  useEffect(() => {
    SetLastPage(location)
  }, [])

  return (
    <Flex
      flexDir="column"
      position="fixed"
      top="0"
      w="100%"
      backgroundColor={bg}
      zIndex={2}
    >
      <Flex
        p={1}
        textAlign="center"
        fontSize="16px"
        borderBottom="1px"
        borderBottomColor="gray.300"
        width="100%"
      >
        <Box mr="auto">
          {isNavMenuOpen ? (
            <IconButton
              size="md"
              aria-label="menu"
              icon={<CloseIcon />}
              onClick={() => {
                onNavMenuClose()
              }}
            />
          ) : (
            <IconButton
              size="md"
              aria-label="menu"
              icon={<HamburgerIcon />}
              onClick={() => {
                onNavMenuOpen()
                onUserMenuClose()
              }}
            />
          )}
          <RefreshSecretsButton />
          <Tooltip label={t`Open vault`} aria-label={t`Open vault`}>
            <IconButton
              size="md"
              ml="2"
              aria-label="menu"
              icon={<IoMdArchive />}
              onClick={async () => {
                chrome.tabs.create({ url: 'vault.html' })
              }}
            />
          </Tooltip>
        </Box>

        <Box ml="auto">
          <Tooltip label={t`Add inputs`} aria-label={t`Add inputs`}>
            <IconButton
              size="md"
              ml="2"
              aria-label="menu"
              icon={<IoIosListBox />}
              onClick={async () => {
                //TODO: Call here trpc procedure and start listening for clicks on inputs
              }}
            />
          </Tooltip>
          {isUserMenuOpen ? (
            <IconButton
              size="md"
              aria-label="menu"
              icon={<CloseIcon />}
              onClick={() => {
                onUserMenuClose()
              }}
            />
          ) : (
            <IconButton
              size="md"
              aria-label="menu"
              icon={<LockIcon />}
              onClick={() => {
                onUserMenuOpen()
                onNavMenuClose()
              }}
            />
          )}
        </Box>
      </Flex>

      {isNavMenuOpen && <NavMenu />}
      {isUserMenuOpen && <UserNavMenu />}
    </Flex>
  )
}
