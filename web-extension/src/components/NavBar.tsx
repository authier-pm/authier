import React, {
  FunctionComponent,
  useContext,
  useEffect,
  useState
} from 'react'

import {
  Flex,
  IconButton,
  useDisclosure,
  Box,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon, LockIcon, AddIcon } from '@chakra-ui/icons'

import { Link, useRoute, useLocation, LinkProps, LocationHook } from 'wouter'
import { NavMenu } from '@src/pages/NavMenu'
import { UserNavMenu } from '@src/pages/UserNavMenu'
import { IoMdArchive } from 'react-icons/io'
import { t } from '@lingui/macro'
import { RefreshSecretsButton } from './RefreshSecretsButton'
import { openVaultTab } from '@src/AuthLinkPage'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'

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
  const { currentURL } = useContext(DeviceStateContext)
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
        <Box>
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

        <RefreshSecretsButton />
        <Tooltip label={t`Open vault`} aria-label={t`Open vault`} mr={4}>
          <IconButton
            size="md"
            ml="2"
            aria-label="menu"
            icon={<IoMdArchive />}
            onClick={async () => {
              openVaultTab()
            }}
          />
        </Tooltip>
        <IconButton
          mr={15}
          ml="2"
          colorScheme="blue"
          aria-label="Add item"
          icon={<AddIcon />}
          rounded={'full'}
          onClick={async () => {
            openVaultTab('/addItem?url=' + currentURL)
          }}
        />
        <Box ml="auto">
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
        </Box>
      </Flex>

      {isNavMenuOpen && <NavMenu />}
      {isUserMenuOpen && <UserNavMenu />}
    </Flex>
  )
}
