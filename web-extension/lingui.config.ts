export default {
  catalogs: [
    {
      path: '<rootDir>/src/locale/{locale}/messages',
      include: ['<rootDir>/src/**/*.tsx'],
      exclude: ['**/node_modules/**']
    }
  ],
  compileNamespace: 'ts',

  locales: [
    'en-gb',
    // 'de-de',
    'pseudo'
  ],

  pseudoLocale: 'pseudo',
  fallbackLocales: {
    pseudo: 'en-gb'
  },
  format: 'po',
  formatOptions: { origins: true, lineNumbers: false }
}
