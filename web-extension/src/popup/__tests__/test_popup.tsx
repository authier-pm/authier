import * as React from 'react'
import { Popup } from '../Popup'
import renderer from 'react-test-renderer'

it('component renders', () => {
  const tree = renderer.create(<Popup />).toJSON()
  expect(tree).toMatchSnapshot()
})
