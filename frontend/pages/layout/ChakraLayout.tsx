import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import {
  Box,
  Flex,
  HStack,
  IconButton,
  useDisclosure,
  Image,
  Stack
} from '@chakra-ui/react'
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons'
import { NavLink, Links } from '../index.page'
import Link from 'next/link'
import React from 'react'
import { kebabCase } from 'lodash'

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
          <Flex alignItems={'center'}></Flex>
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
