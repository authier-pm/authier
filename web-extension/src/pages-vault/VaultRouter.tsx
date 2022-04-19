import React, { useEffect, useState } from 'react'
import SidebarWithHeader from '../components/vault/SidebarWithHeader'
import { ItemList } from '@src/pages-vault/ItemList'
import { Route, Switch, useHistory } from 'react-router-dom'
import { VaultItemSettings } from '@src/components/vault/ItemSettings'
import { VaultSettings } from './VaultSettings'
import { device } from '@src/background/ExtensionDevice'
import Login from '@src/pages-vault/Login'
import { Box, Center } from '@chakra-ui/react'
import Premium from './Premium'
import Devices from './Devices'
import { VaultImportExport } from './VaultImportExport'
import Register from './Register'
import { VaultUnlockVerification } from '@src/pages/VaultUnlockVerification'
import { AddItem } from './AddItem'

export function VaultRouter() {
  const history = useHistory()

  useEffect(() => {
    if (device.lockedState) {
      history.push('/verify')
    }
  }, [device.lockedState])

  if (device.state === null) {
    return (
      <Center marginX="50%" h="100vh">
        <Switch>
          <Route path="/" exact>
            <Login />
          </Route>
          <Route path="/signup">
            <Register />
          </Route>
          <Route path="/verify">
            <VaultUnlockVerification />
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
        <Route path="/addItem">
          <AddItem />
        </Route>
      </Switch>
    </SidebarWithHeader>
  )
}
