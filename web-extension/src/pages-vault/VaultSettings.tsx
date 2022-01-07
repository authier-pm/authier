import { Flex, HStack, Link, useColorModeValue } from '@chakra-ui/react'
import {
  Link as RouterLink,
  Route,
  Switch,
  useRouteMatch
} from 'react-router-dom'
import React from 'react'
import Account from '@src/components/vault/settings/Account'
import Config from '@src/components/vault/settings/Config'

interface LinkItemProps {
  name: string
  path: string
  selected: boolean
}

interface Props extends LinkItemProps {
  url: string
  handleClick: () => void
}
const LinkItems: Array<LinkItemProps> = [
  { name: 'Account', path: '/account', selected: false },
  { name: 'Config', path: '/config', selected: false }
]

const NavLink = ({ name, path, handleClick, url, selected }: Props) => {
  return (
    <Flex
      align="center"
      px={2}
      py={1}
      borderRadius="lg"
      role="group"
      cursor="pointer"
      _hover={{
        bg: useColorModeValue('gray.100', 'gray.700')
      }}
      fontSize={20}
      bgColor={
        selected ? useColorModeValue('gray.100', 'gray.700') : 'transparent'
      }
      onClick={() => handleClick()}
    >
      <Link as={RouterLink} to={url + path} style={{ textDecoration: 'none' }}>
        {name}
      </Link>
    </Flex>
  )
}

export const VaultSettings = () => {
  const { url } = useRouteMatch()

  return (
    <Flex
      flexDirection={'column'}
      m="auto"
      maxW={'320px'}
      w={'full'}
      bg={useColorModeValue('white', 'gray.900')}
      boxShadow={'2xl'}
      rounded={'lg'}
      p={6}
      textAlign={'center'}
    >
      <HStack as={'nav'} spacing={4} display={{ base: 'none', md: 'flex' }}>
        {LinkItems.map((link, i, arr) => {
          const handleClick = () => {
            arr.forEach((j) => {
              j.selected ? (j.selected = false) : null
            })
            link.selected = true
          }

          return (
            <NavLink
              key={link.name}
              path={link.path}
              selected={link.selected}
              handleClick={handleClick}
              name={link.name}
              url={url}
            />
          )
        })}
      </HStack>

      <Switch>
        <Route exact path={'/settings/account'}>
          <Account />
        </Route>
        <Route path={'/settings/config'}>
          <Config />
        </Route>
      </Switch>
    </Flex>
  )
}
