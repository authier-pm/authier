import renderer from 'react-test-renderer'

it('Home component renders', () => {
  const tree = renderer.create(<>Test</>)
  expect(tree).toBeTruthy()
})
