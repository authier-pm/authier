import React from 'react'
import SidebarWithHeader from '../components/vault/SidebarWithHeader'
import { ItemList } from '@src/pages-vault/ItemList'
import { Route, Switch } from 'react-router-dom'
import { VaultItemSettings } from '@src/components/vault/ItemSettings'
import { VaultSettings } from './VaultSettings'
import { device } from '@src/background/ExtensionDevice'
import Login from '@src/pages-vault/Login'
import { Box, Center } from '@chakra-ui/react'
import Premium from './Premium'
import Devices from './Devices'
import { VaultImportExport } from './VaultImportExport'
import Register from './Register'

export function VaultRouter() {
  if (device.state === null) {
    console.log('aaafd')
    return (
      <Center mw="50%" h="100vh">
        <Switch>
          <Route path="/" exact>
            <Login />
          </Route>
          <Route path="/signup">
            <Register />
          </Route>
        </Switch>
      </Center>
    )
  }

  return (
    <SidebarWithHeader>
      <Switch>
        <Route exact path="/">
          <ItemList />
        </Route>
        <Route
          path="/secret/:secretId"
          children={({ match }) => (
            <VaultItemSettings secretId={match?.params.secretId as string} />
          )}
        />
        <Route path="/account-limits">
          <Premium />
        </Route>
        <Route path="/settings">
          <VaultSettings />
        </Route>
        <Route path="/devices">
          <Devices />
        </Route>
        <Route path="/import-export">
          <VaultImportExport />
        </Route>
      </Switch>
    </SidebarWithHeader>
  )
}
