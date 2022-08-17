export default {
  locales: ['en'],
  catalogs: [
    {
      path: 'src/locales/{locale}/messages',
      include: ['src']
    }
  ],
  format: 'po',
  formatOptions: { origins: true, lineNumbers: false },
  pseudoLocale: 'pseudo',
  fallbackLocales: {
    pseudo: 'en'
  }
}
