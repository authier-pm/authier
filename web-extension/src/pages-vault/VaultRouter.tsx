import React from 'react'
import SidebarWithHeader from '../components/vault/SidebarWithHeader'
import { ItemList } from '@src/components/vault/ItemList'
import { Route, Switch } from 'react-router-dom'
import { ItemSettings } from '@src/components/vault/ItemSettings'
import { VaultSettings } from './VaultSettings'
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'

export function VaultRouter() {
  return (
    <SidebarWithHeader>
      <Switch>
        <Route exact path="/">
          <ItemList />
        </Route>
        <Route
          path="/secret/:item"
          children={({
            location
          }: {
            location: { state: { data: ILoginSecret | ITOTPSecret } }
          }) => <ItemSettings {...location.state.data} />}
        />
        <Route path="/settings">
          <VaultSettings />
        </Route>
      </Switch>
    </SidebarWithHeader>
  )
}
