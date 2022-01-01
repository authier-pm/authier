import React from 'react'
import SidebarWithHeader from '../components/vault/SidebarWithHeader'
import { ItemList } from '@src/components/vault/ItemList'
import { Route, Switch } from 'react-router-dom'
import { ItemSettings } from '@src/components/vault/ItemSettings'
import { VaultSettings } from './VaultSettings'

export function Vault() {
  return (
    <SidebarWithHeader>
      <Switch>
        <Route exact path="/">
          <ItemList />
        </Route>
        <Route
          path="/list/:item"
          children={({ location }) => (
            //@ts-expect-error
            <ItemSettings {...location.state.data} />
          )}
        />
        <Route path="/settings">
          <VaultSettings />
        </Route>
      </Switch>
    </SidebarWithHeader>
  )
}
