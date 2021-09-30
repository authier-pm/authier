import React from 'react'
import SidebarWithHeader from '../components/vault/SidebarWithHeader'
import { ItemList } from '@src/components/vault/ItemList'
import { ItemSettings } from '@src/pages-vault/ItemSettings'
import { Route, useLocation, Switch } from 'react-router-dom'
import { VaultSettings } from './VaultSettings'

export function Vault() {
  const location = useLocation()

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
            <ItemSettings data={location.state.data} />
          )}
        />
        <Route path="/settings">
          <VaultSettings />
        </Route>
      </Switch>
    </SidebarWithHeader>
  )
}
