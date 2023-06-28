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
  format: 'po',
  formatOptions: { origins: true, lineNumbers: false },
  pseudoLocale: 'pseudo',
  fallbackLocales: {
    pseudo: 'en'
  }
}
