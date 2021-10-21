import React from 'react'
import { wrapInProviders } from '../test/providers'
import renderer from 'react-test-renderer'
import { Login } from '../src/screens/Login'

it('Home component renders', () => {
  const tree = renderer.create(wrapInProviders(<Login />)).toJSON()
  expect(tree).toMatchSnapshot()
})
