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
import VaultSecurity from '@src/components/vault/settings/VaultConfig'
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
  { name: 'Security', path: '/security' }
]

const NavLink = ({ name, path, handleClick, url, selected }: Props) => {
  return (
    <Link as={RouterLink} to={url + path} style={{ textDecoration: 'none' }}>
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
        {name}
      </Box>
    </Link>
  )
}

export const VaultSettings = () => {
  // const { url } = useMatch('/secret/:secretId')
  const location = useLocation()
  const [selectedTab, setSelectedTab] = useState(LinkItems[0])

  return (
    <Flex align={'center'} justify={'center'} flexDirection={'column'}>
      <HStack as={'nav'} spacing={4} mb={10}>
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
          <Route path={'/security'} element={<VaultSecurity />}></Route>
        </Routes>
      </AnimatePresence>
    </Flex>
  )
}
