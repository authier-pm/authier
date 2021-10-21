import React from 'react'
import Home from '../src/screens/Home'
import { wrapInFEProviders } from '../test/providers'
import renderer from 'react-test-renderer'

it('Home component renders', () => {
  //const ac = makeSsrClient({})

  const tree = renderer.create(wrapInFEProviders(<Home />)).toJSON()
  expect(tree).toMatchSnapshot()
})
