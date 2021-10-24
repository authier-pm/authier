import React from 'react'

import renderer from 'react-test-renderer'

it('Home component renders', () => {
  const tree = renderer.create(<></>).toJSON()
  expect(tree).toMatchSnapshot()
})
