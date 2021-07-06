import { ChakraProvider, theme } from '@chakra-ui/react'
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
import { NavLink, Links } from '../index'
import Link from 'next/link'

export function ChakraLayout({ children }) {
  const { isOpen, onOpen, onClose } = useDisclosure()

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
              <Box cursor="pointer" zIndex={100}>
                <Image
                  boxSize={'110px'}
                  mt={30}
                  src="/assets/logos/logo.png"
                ></Image>
              </Box>
            </Link>

            <HStack
              as={'nav'}
              spacing={4}
              display={{ base: 'none', md: 'flex' }}
            >
              <NavLink href={'/features'}>Features</NavLink>
              <NavLink href={'/pricing'}>Pricing</NavLink>
              <NavLink href={'/privacy'}>Privacy policy</NavLink>
              <NavLink href={'/faq'}>FAQ</NavLink>
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
                  src={
                    'https://images.unsplash.com/photo-1493666438817-866a91353ca9?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&fit=crop&h=200&w=200&s=b616b2c5b373a80ffc9636ba24f7a4a9'
                  }
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
              {Links.map((link) => (
                <NavLink key={link} href={'#'}>
                  {link}
                </NavLink>
              ))}
            </Stack>
          </Box>
        ) : null}
      </Box>

      <Box p={4} mt={9}>
        {children}
      </Box>
    </ChakraProvider>
  )
}

export default ChakraLayout
