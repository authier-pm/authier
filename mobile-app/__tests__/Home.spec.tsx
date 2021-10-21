import React from 'react'
import Home from '../src/screens/Home'
import { wrapInProviders } from '../test/providers'
import renderer from 'react-test-renderer'

it('Home component renders', () => {
  const tree = renderer.create(wrapInProviders(<Home />)).toJSON()
  expect(tree).toMatchSnapshot()
})
