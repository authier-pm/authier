import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import {
  Box,
  Flex,
  Avatar,
  HStack,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  Image,
  Stack
} from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon, AddIcon } from '@chakra-ui/icons'
import { NavLink, Links } from '../index.page'
import Link from 'next/link'
import { kebabCase } from 'lodash'
import MD5 from 'crypto-js/md5'

const theme = extendTheme({
  colors: {
    brand: {
      50: '#84CAE7',
      100: '#68D5DD',
      200: '#5ADBD8',
      300: '#4CE0D2',
      400: '#37C5BA',
      500: '#22AAA1',
      600: '#1B8D82',
      700: '#136F63',
      800: '#0C453C',
      900: '#041B15'
    }
  }
})

export function ChakraLayout({ children }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  // const email = device.state?.email
  const email = 'bob@bob.com'

  const navLinks = Links.map((link) => (
    <NavLink key={link} href={kebabCase(link)}>
      {link}
    </NavLink>
  ))
  return (
    <ChakraProvider theme={theme}>
      <Box bgColor={'gray.700'} px={4}>
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
          <IconButton
            size={'md'}
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label={'Open Menu'}
            display={{ md: !isOpen ? 'none' : 'inherit' }}
            onClick={isOpen ? onClose : onOpen}
          />
          <HStack spacing={8} alignItems={'center'}>
            <Link href="/">
              <Box cursor="pointer">
                <Image
                  boxSize={'60px'}
                  src="/assets/logos/logo.png"
                  objectFit="cover"
                ></Image>
              </Box>
            </Link>

            <HStack
              as={'nav'}
              spacing={4}
              display={{ base: 'none', md: 'flex' }}
            >
              {navLinks}
            </HStack>
          </HStack>
          <Flex alignItems={'center'}>
            <Button
              onClick={() => {
                console.log('aaa')
              }}
              variant={'solid'}
              colorScheme={'teal'}
              size={'sm'}
              mr={4}
              leftIcon={<AddIcon />}
            >
              Action
            </Button>
            <Menu>
              <MenuButton
                as={Button}
                rounded={'full'}
                variant={'link'}
                cursor={'pointer'}
              >
                <Avatar
                  size={'sm'}
                  src={`https://www.gravatar.com/avatar/${MD5(email)}}`}
                />
              </MenuButton>
              <MenuList>
                <MenuItem>Link 1</MenuItem>
                <MenuItem>Link 2</MenuItem>
                <MenuDivider />
                <MenuItem>Link 3</MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Flex>

        {isOpen ? (
          <Box pb={4}>
            <Stack as={'nav'} spacing={4}>
              {navLinks}
            </Stack>
          </Box>
        ) : null}
      </Box>

      {children}
    </ChakraProvider>
  )
}

export default ChakraLayout
