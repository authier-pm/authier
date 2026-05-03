import { formatter } from '@lingui/format-po'

export default {
  catalogs: [
    {
      path: '<rootDir>/src/locale/{locale}/messages',
      include: ['<rootDir>/src/**/*.tsx'],
      exclude: ['**/node_modules/**']
    }
  ],
  compileNamespace: 'ts',
  sourceLocale: 'en',
  locales: ['en', 'cs'],
  pseudoLocale: 'pseudo',
  fallbackLocales: {
    pseudo: 'en'
  },
  format: formatter({ origins: true, lineNumbers: false })
}
