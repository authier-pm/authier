import React from 'react'
import { makeSsrClient, wrapInProviders } from '../test/providers'
import renderer from 'react-test-renderer'
import { Login } from '../src/screens/Login'

it('Home component renders', () => {
  const ac = makeSsrClient({})
  const tree = renderer
    .create(wrapInProviders(<Login navigation={() => {}} />, ac))
    .toJSON()
  expect(tree).toMatchSnapshot()
})
