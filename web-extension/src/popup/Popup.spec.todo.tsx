import React from 'react'
import { Popup } from './Popup'
import renderer from 'react-test-renderer'
import { makeSsrClient, wrapInFEProviders } from '../../tests/providers'

it('component renders', () => {
  const ac = makeSsrClient({})

  const tree = renderer.create(wrapInFEProviders(<Popup />, ac)).toJSON()
  expect(tree).toMatchSnapshot()
})
