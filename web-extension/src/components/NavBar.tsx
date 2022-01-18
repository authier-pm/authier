import React, { FunctionComponent, useEffect, useState } from 'react'

import { Flex, IconButton, useDisclosure, Box, Tooltip } from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon, LockIcon } from '@chakra-ui/icons'

import { Link, useRoute, useLocation, LinkProps, LocationHook } from 'wouter'
import { NavMenu } from '@src/pages/NavMenu'
import { UserNavMenu } from '@src/pages/UserNavMenu'
import { IoMdRefreshCircle, IoMdArchive } from 'react-icons/io'
import { device } from '@src/background/ExtensionDevice'
import { toast } from 'react-toastify'
import { t, Trans } from '@lingui/macro'

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
  const [isSyncing, setIsSyncing] = useState(false)
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
        p={1}
        textAlign="center"
        backgroundColor="whitesmoke"
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
          <Tooltip
            label={<Trans>Synchronize vault</Trans>}
            aria-label={t`Synchronize vault`}
          >
            <IconButton
              size="md"
              ml="2"
              aria-label="menu"
              icon={<IoMdRefreshCircle />}
              disabled={isSyncing}
              onClick={async () => {
                setIsSyncing(true)
                await device.state?.backendSync()
                setIsSyncing(false)
                toast.success('Sync successful')
              }}
            />
          </Tooltip>
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
