module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  extends: [
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from @typescript-eslint/eslint-plugin
    'plugin:react/recommended', // Uses the recommended rules from @eslint-plugin-react
    'prettier'
  ],
  plugins: ['jest'],
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
    ecmaFeatures: {
      jsx: true // Allows for the parsing of JSX
    }
  },
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    // e.g. "@typescript-eslint/explicit-function-return-type": "off",
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    'array-callback-return': 'error',
    'getter-return': 'error',
    'comma-dangle': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off' // this does not work correctly for type imports
  },
  settings: {
    react: {
      version: 'detect' // Tells eslint-plugin-react to automatically detect the version of React to use
    }
  },
  ignorePatterns: ['dist', 'node_modules', 'examples', 'scripts']
}
