import React, {
  FunctionComponent,
  useContext,
  useEffect,
  useState
} from 'react'

import { Flex, IconButton, useDisclosure, Box } from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon, LockIcon } from '@chakra-ui/icons'

import { Link, useRoute, useLocation, LinkProps, LocationHook } from 'wouter'
import { NavMenu } from '@src/pages/NavMenu'
import { UserNavMenu } from '@src/pages/UserNavMenu'
import { IoMdRefreshCircle } from 'react-icons/io'
import { useSyncEncryptedSecretsLazyQuery } from './NavBar.codegen'
import { bgState } from '@src/background/backgroundPage'
import { BackgroundContext } from '@src/providers/BackgroundProvider'
import { EncryptedSecretGql } from '../../../shared/generated/graphqlBaseTypes'

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
  const { initEncryptedSecrets, backgroundState } =
    useContext(BackgroundContext)

  const [getEncryptedSecretsToSync, { data }] =
    useSyncEncryptedSecretsLazyQuery()

  useEffect(() => {
    if (data) {
      console.log(data)
      initEncryptedSecrets(
        data.currentDevice.encryptedSecretsToSync as EncryptedSecretGql[]
      )
    }
  }, [data])

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
        width="330px"
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

          <IconButton
            size="md"
            ml="2"
            aria-label="menu"
            icon={<IoMdRefreshCircle />}
            onClick={async () => {
              getEncryptedSecretsToSync()
            }}
          />
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
