import React from 'react'
import SidebarWithHeader from '../components/vault/SidebarWithHeader'
import { ItemList } from '@src/components/vault/ItemList'
import { Route, useLocation, Switch } from 'react-router-dom'
import { ItemSettings } from '@src/components/vault/ItemSettings'
import { VaultSettings } from './VaultSettings'

export function Vault() {
  const location = useLocation()

  return (
    <SidebarWithHeader>
      <Switch>
        <Route path="/">
          <ItemList />
        </Route>
        <Route
          path="/list/:item"
          children={({ location }) => {
            console.log(location)
            return <ItemSettings {...location.state.data} />
          }}
        />
        <Route path="/settings">
          <VaultSettings />
        </Route>
      </Switch>
    </SidebarWithHeader>
  )
}
