import { formatter } from '@lingui/format-po'

export default {
  locales: ['en', 'cs'],
  sourceLocale: 'en',
  catalogs: [
    {
      path: 'src/locales/{locale}/messages',
      include: ['src'],
      exclude: ['**/node_modules/**']
    }
  ],
  format: formatter({ origins: true, lineNumbers: false }),
  pseudoLocale: 'pseudo',
  fallbackLocales: {
    pseudo: 'en'
  }
}
