import {
  Box,
  Flex,
  HStack,
  IconButton,
  useDisclosure,
  Image,
  Stack,
  Button,
  useColorMode,
  useColorModeValue
} from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon, MoonIcon, SunIcon } from '@chakra-ui/icons'

import { NavLink, Links } from '../index.page'
import Link from 'next/link'

import { kebabCase } from 'lodash'
import { Footer } from '../../components/Footer'

export function ChakraLayout({ children }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { colorMode, toggleColorMode } = useColorMode()

  const navLinks = Links.map((link) => (
    <NavLink key={link} href={kebabCase(link)}>
      {link}
    </NavLink>
  ))
  return (
    <Flex direction="column" justify="center">
      <Box
        bgColor={useColorModeValue('white', 'gray.900')}
        px={4}
        borderBottom={'1px'}
        borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
        top={0}
        h="60px"
        minH="60px"
        zIndex={100}
      >
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
                  rounded={'full'}
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
          <Flex alignItems={'center'}></Flex>
          <Button onClick={toggleColorMode}>
            {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
          </Button>
        </Flex>

        {isOpen ? (
          <Box pb={4}>
            <Stack as={'nav'} spacing={4}>
              {navLinks}
            </Stack>
          </Box>
        ) : null}
      </Box>
      <Box>{children}</Box>

      <Footer />
    </Flex>
  )
}

export default ChakraLayout
