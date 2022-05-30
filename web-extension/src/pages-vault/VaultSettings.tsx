import {
  Box,
  Center,
  Flex,
  HStack,
  Link,
  useColorModeValue
} from '@chakra-ui/react'
import {
  Link as RouterLink,
  Route,
  useLocation,
  Routes,
  useMatch
} from 'react-router-dom'
import React, { useState } from 'react'
import Account from '@src/components/vault/settings/Account'
import VaultConfig from '@src/components/vault/settings/VaultConfig'
import { AnimatePresence, motion } from 'framer-motion'

interface LinkItemProps {
  name: string
  path: string
}

interface Props extends LinkItemProps {
  url: string
  handleClick: () => void
  selected: LinkItemProps
}
const LinkItems: Array<LinkItemProps> = [
  { name: 'Account', path: '/account' },
  { name: 'Config', path: '/config' }
]

const NavLink = ({ name, path, handleClick, url, selected }: Props) => {
  return (
    <Box
      verticalAlign="center"
      px={2}
      py={1}
      borderRadius="lg"
      role="group"
      cursor="pointer"
      fontSize={20}
      bgColor={
        selected.name === name
          ? useColorModeValue('gray.100', 'gray.700')
          : 'transparent'
      }
      onClick={() => handleClick()}
    >
      <Link as={RouterLink} to={url + path} style={{ textDecoration: 'none' }}>
        {name}
      </Link>
    </Box>
  )
}

export const VaultSettings = () => {
  // const { url } = useMatch('/secret/:secretId')
  const location = useLocation()
  const [selectedTab, setSelectedTab] = useState(LinkItems[0])

  return (
    <Flex
      rounded={'lg'}
      boxShadow={'lg'}
      align={'center'}
      justify={'center'}
      flexDirection={'column'}
      m="auto"
      bg={useColorModeValue('white', 'gray.900')}
    >
      <HStack as={'nav'} spacing={4}>
        {LinkItems.map((link) => {
          const handleClick = () => {
            setSelectedTab(link)
          }
          return (
            <NavLink
              key={link.name}
              path={link.path}
              selected={selectedTab}
              handleClick={handleClick}
              name={link.name}
              url={'/settings'}
            />
          )
        })}
      </HStack>

      <AnimatePresence exitBeforeEnter>
        <Routes key={location.pathname}>
          <Route path={'/account'} element={<Account />}></Route>
          <Route path={'/config'} element={<VaultConfig />}></Route>
        </Routes>
      </AnimatePresence>
    </Flex>
  )
}
