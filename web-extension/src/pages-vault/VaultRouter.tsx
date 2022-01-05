import React from 'react'
import SidebarWithHeader from '../components/vault/SidebarWithHeader'
import { ItemList } from '@src/components/vault/ItemList'
import { Route, Switch } from 'react-router-dom'
import { VaultItemSettings } from '@src/components/vault/ItemSettings'
import { VaultSettings } from './VaultSettings'
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'
import { device } from '@src/background/ExtensionDevice'
import Login from '@src/pages/Login'
import { Center } from '@chakra-ui/react'

export function VaultRouter() {
  if (device.state === null) {
    return (
      <Center mw="50%" h="100vh">
        <Login></Login>
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
            <VaultItemSettings secretId={match?.params.secretId} />
          )}
        />
        <Route path="/settings">
          <VaultSettings />
        </Route>
      </Switch>
    </SidebarWithHeader>
  )
}
