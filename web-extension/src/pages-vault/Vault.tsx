import React from 'react'
import SidebarWithHeader from '../components/vault/SidebarWithHeader'
import { ItemList } from '@src/components/vault/ItemList'
import { Item } from '@src/components/vault/Item'
import { Route, useLocation, Switch } from 'react-router-dom'
import { ILoginCredentials } from '@src/util/useBackgroundState'

export function Vault() {
  const location = useLocation()
  console.log(location)
  return (
    <SidebarWithHeader>
      <Switch>
        <Route exact path="/">
          <ItemList />
        </Route>
        <Route
          path="/list/:item"
          children={({ location }) => <Item data={location.state.data} />}
        />
      </Switch>
    </SidebarWithHeader>
  )
}
