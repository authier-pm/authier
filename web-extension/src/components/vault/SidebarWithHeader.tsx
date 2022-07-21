import React, { ReactNode } from 'react'
import {
  IconButton,
  Avatar,
  Box,
  CloseButton,
  Flex,
  HStack,
  VStack,
  Icon,
  useColorModeValue,
  Link,
  Drawer,
  DrawerContent,
  Text,
  useDisclosure,
  BoxProps,
  FlexProps,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  useColorMode,
  Spinner
} from '@chakra-ui/react'
import {
  FiHome,
  FiStar,
  FiSettings,
  FiMenu,
  FiChevronDown,
  FiMoon,
  FiHardDrive,
  FiDisc
} from 'react-icons/fi'
import { IconType } from 'react-icons'
import { ReactText } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { device } from '@src/background/ExtensionDevice'
import MD5 from 'crypto-js/md5'
import { AddIcon, ChevronDownIcon } from '@chakra-ui/icons'
import { t, Trans } from '@lingui/macro'
import { ColorModeButton } from '../ColorModeButton'

interface LinkItemProps {
  title: JSX.Element
  icon: IconType
  path: string
}
const LinkItems: Array<LinkItemProps> = [
  { title: <Trans>Vault</Trans>, icon: FiHome, path: '/' },
  {
    title: <Trans>Settings</Trans>,
    icon: FiSettings,
    path: '/settings/account'
  },
  {
    title: <Trans>Account Limits</Trans>,
    icon: FiStar,
    path: '/account-limits'
  },
  { title: <Trans>Devices</Trans>, icon: FiHardDrive, path: '/devices' },
  {
    title: <Trans>Import & Export</Trans>,
    icon: FiDisc,
    path: '/import-export'
  }
]

export default function SidebarWithHeader({
  children
}: {
  children: ReactNode
}) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <SidebarContent
        onClose={() => onClose}
        display={{ base: 'none', md: 'block' }}
      />
      <Drawer
        autoFocus={false}
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false}
        onOverlayClick={onClose}
        size="full"
      >
        <DrawerContent>
          <SidebarContent onClose={onClose} />
        </DrawerContent>
      </Drawer>
      {/* mobilenav */}
      <MobileNav display={{ base: 'flex', md: 'none' }} onOpen={onOpen} />
      <Box ml={{ base: 0, md: 60 }} p="7">
        {children}
      </Box>
    </Box>
  )
}

interface SidebarProps extends BoxProps {
  onClose: () => void
}

const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
  const { toggleColorMode } = useColorMode()
  const email = device.state?.email
  if (!email) {
    return <Spinner />
  }
  return (
    <Flex
      transition="1s ease"
      bg={useColorModeValue('white', 'gray.800')}
      borderRight="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      w={{ base: 'full', md: 60 }}
      pos="fixed"
      h="full"
      flexDirection="column"
      alignItems="center"
      {...rest}
    >
      <Flex justifyContent={'flex-end'} flexDirection="column" height="inherit">
        <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
          <Text fontSize="2xl" fontFamily="monospace" fontWeight="bold">
            Authier
          </Text>
          <CloseButton
            display={{ base: 'flex', md: 'none' }}
            onClick={onClose}
          />
        </Flex>
        <Flex flexDirection="column" height="100%">
          {LinkItems.map((link, i) => (
            <NavItem key={i} icon={link.icon} path={link.path}>
              {link.title}
            </NavItem>
          ))}
          <ColorModeButton />
        </Flex>

        <HStack spacing={{ base: '0', md: '6' }} w="80%" m={4}>
          <Flex alignItems={'center'} w="100%">
            <Menu>
              <MenuButton
                py={2}
                transition="all 0.3s"
                _focus={{ boxShadow: 'none' }}
                w="100%"
              >
                <Flex w="100%">
                  <Avatar
                    size={'sm'}
                    src={`https://www.gravatar.com/avatar/${MD5(email)}}`}
                  />
                  <VStack
                    display={{ base: 'none', md: 'flex' }}
                    alignItems="flex-start"
                    spacing="1px"
                    ml="2"
                    mr="auto"
                  >
                    <Text fontSize="sm">{email}</Text>
                    <Text fontSize="xs" color="gray.600">
                      Admin
                    </Text>
                  </VStack>
                  <Box display={{ base: 'none', md: 'flex' }} ml="auto">
                    <ChevronDownIcon boxSize={19} />
                  </Box>
                </Flex>
              </MenuButton>
              <MenuList
                bg={useColorModeValue('white', 'gray.900')}
                borderColor={useColorModeValue('gray.200', 'gray.700')}
              >
                <MenuItem>Profile</MenuItem>
                <MenuItem>Settings</MenuItem>
                <MenuItem>Billing</MenuItem>
                <MenuDivider />
                <MenuItem
                  backgroundColor="red.500"
                  _hover={{
                    backgroundColor: useColorModeValue('red.200', 'red.400')
                  }}
                  onClick={async () => {
                    await device.logout()
                  }}
                >
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </HStack>
      </Flex>
    </Flex>
  )
}

interface NavItemProps extends FlexProps {
  icon: IconType
  path: string
  children: ReactText | JSX.Element
}
const NavItem = ({ icon, path, children, ...rest }: NavItemProps) => {
  return (
    <Link
      as={RouterLink}
      to={path}
      style={{ textDecoration: 'none' }}
      _activeLink={{
        bg: 'teal.100' // TODO fix
      }}
    >
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        _hover={{
          bg: 'cyan.100',
          color: 'gray.400'
        }}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            _groupHover={{
              color: 'gray.400'
            }}
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Link>
  )
}

interface MobileProps extends FlexProps {
  onOpen: () => void
}
const MobileNav = ({ onOpen, ...rest }: MobileProps) => {
  const email = device.state?.email as string

  const { toggleColorMode } = useColorMode()
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4, md: 4 }}
      height="20"
      alignItems="center"
      bg={useColorModeValue('white', 'gray.900')}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
      justifyContent={{ base: 'space-between', md: 'flex-end' }}
      {...rest}
    >
      <IconButton
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpen}
        variant="outline"
        aria-label="open menu"
        icon={<FiMenu />}
      />

      <Text
        display={{ base: 'flex', md: 'none' }}
        fontSize="2xl"
        fontFamily="monospace"
        fontWeight="bold"
      >
        Logo
      </Text>

      <HStack spacing={{ base: '0', md: '6' }}>
        <ColorModeButton />
        <Flex alignItems={'center'}>
          <Menu>
            <MenuButton
              py={2}
              transition="all 0.3s"
              _focus={{ boxShadow: 'none' }}
            >
              <HStack>
                <Avatar
                  size={'sm'}
                  src={`https://www.gravatar.com/avatar/${MD5(email)}}`}
                />
                <VStack
                  display={{ base: 'none', md: 'flex' }}
                  alignItems="flex-start"
                  spacing="1px"
                  ml="2"
                >
                  <Text fontSize="sm">{email}</Text>
                  <Text fontSize="xs" color="gray.600">
                    Admin
                  </Text>
                </VStack>
                <Box display={{ base: 'none', md: 'flex' }}>
                  <FiChevronDown />
                </Box>
              </HStack>
            </MenuButton>
            <MenuList
              bg={useColorModeValue('white', 'gray.900')}
              borderColor={useColorModeValue('gray.200', 'gray.700')}
            >
              <MenuItem>Profile</MenuItem>
              <MenuItem>Settings</MenuItem>
              <MenuItem>Billing</MenuItem>
              <MenuDivider />
              <MenuItem
                backgroundColor="red.400"
                onClick={() => {
                  device.logout()
                }}
              >
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </HStack>
    </Flex>
  )
}
