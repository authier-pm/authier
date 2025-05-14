import { FunctionComponent, useEffect, useState } from 'react'

import {
  Flex,
  IconButton,
  useDisclosure,
  Box,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react'
import { CloseIcon, LockIcon, AddIcon } from '@chakra-ui/icons'

import { useLocation } from 'wouter'

import { UserNavMenu } from '@src/pages/UserNavMenu'
import { IoMdArchive } from 'react-icons/io'
import { t } from '@lingui/core/macro'
import { RefreshSecretsButton } from './RefreshSecretsButton'
import { openVaultTab } from '@src/AuthLinkPage'
import { AddSecretNavMenu } from '@src/pages/AddSecretNavMenu'

export const PopupNavBar: FunctionComponent = () => {
  const {
    isOpen: isAddSecretNavMenuOpen,
    onOpen: onAddSecretNavMenuOpen,
    onClose: onAddSecretNavMenuClose
  } = useDisclosure()
  const {
    isOpen: isUserMenuOpen,
    onOpen: onUserMenuOpen,
    onClose: onUserMenuClose
  } = useDisclosure()
  const [location, setLocation] = useLocation()
  const [lastPage, SetLastPage] = useState<string>('/')

  const bg = useColorModeValue('gray.100', 'gray.800')

  useEffect(() => {
    SetLastPage(location)
  }, [])

  return (
    <Flex flexDir="column" top="0" w="100%" backgroundColor={bg} zIndex={2}>
      <Flex
        p={1}
        textAlign="center"
        fontSize="16px"
        borderBottom="1px"
        borderBottomColor="gray.300"
        width="100%"
      >
        <Flex justify="space-between" minW={205}>
          <Box mr={2}>
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
                  onAddSecretNavMenuClose()
                }}
              />
            )}
          </Box>

          <RefreshSecretsButton />

          <Tooltip
            label={isAddSecretNavMenuOpen ? t`close menu` : t`add secret`}
            aria-label={isAddSecretNavMenuOpen ? t`close menu` : t`add secret`}
          >
            <IconButton
              mr={15}
              ml="2"
              colorScheme="blue"
              aria-label="Add item"
              icon={isAddSecretNavMenuOpen ? <CloseIcon /> : <AddIcon />}
              rounded={'full'}
              onClick={async () => {
                !isAddSecretNavMenuOpen
                  ? onAddSecretNavMenuOpen()
                  : onAddSecretNavMenuClose()
                onUserMenuClose()
              }}
            />
          </Tooltip>
        </Flex>

        <Box ml="auto">
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
        </Box>
      </Flex>

      {isAddSecretNavMenuOpen && <AddSecretNavMenu />}
      {isUserMenuOpen && <UserNavMenu />}
    </Flex>
  )
}
