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

import { useLocation } from 'wouter'
import { NavMenu } from '@src/pages/NavMenu'
import { UserNavMenu } from '@src/pages/UserNavMenu'
import { IoMdArchive } from 'react-icons/io'
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
  console.log('~ location', location)
  const [lastPage, SetLastPage] = useState<string>('/')

  const bg = useColorModeValue('whitesmoke', 'white.500')

  useEffect(() => {
    SetLastPage(location)
  }, [])

  return (
    <Flex flexDir="column" minW="350px">
      <Flex
        p={1}
        textAlign="center"
        backgroundColor={bg}
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
