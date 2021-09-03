export default {
  catalogs: [
    {
      path: '<rootDir>/src/locale/{locale}/messages',
      include: ['<rootDir>/src/emails/**/*.tsx'],
      exclude: ['**/node_modules/**']
    }
  ],
  compileNamespace: 'ts',

  locales: ['en', 'en', 'de', 'fr', 'it', 'es', 'pt', 'pseudo'],

  pseudoLocale: 'pseudo',
  fallbackLocales: {
    pseudo: 'en'
  },
  format: 'po',
  formatOptions: { origins: true, lineNumbers: false },
  extractBabelOptions: {
    presets: ['@babel/preset-react', '@babel/preset-typescript'],
    plugins: [
      [
        '@babel/plugin-proposal-decorators',
        {
          legacy: true
        }
      ]
    ]
  }
}
