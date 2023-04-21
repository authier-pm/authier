/**
 * @format
 */

import React from 'react'

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer'
import { it } from '@jest/globals'

it('renders correctly', () => {
  renderer.create(<></>)
})
