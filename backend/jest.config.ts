// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html
const { jsWithTs: tsjPreset } = require('ts-jest/presets')

export default {
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  // A map from regular expressions to module names that allow to stub out resources with a single module
  moduleNameMapper: {
    '@src/(.*)': '<rootDir>/src/$1',
    '\\.(css|less|scss|sss|styl)$': '<rootDir>/node_modules/jest-css-modules'
  },

  roots: ['<rootDir>'],

  setupFiles: ['./tests/setupJest.ts'],

  testPathIgnorePatterns: ['/node_modules/', 'stories.tsx', '/dist/'],

  transform: {
    ...tsjPreset.transform
  },
  globals: {
    'ts-jest': {
      diagnostics: false
    }
  }
}
