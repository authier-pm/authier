# Error documentation

Here's a list of every known bug we've ever encountered.

### Web extension does not have any styling

use this https://classic.yarnpkg.com/en/docs/cli/dedupe or reinstall node_modules

### Firefox /graphiql white screen

https://stackoverflow.com/questions/37298608/content-security-policy-the-pages-settings-blocked-the-loading-of-a-resource

### Frontend theme does not work

Remove all node_module and run `yarn`

## React Native

### Configuration not found cli-config/build/readConfigFromDisk.js not supported.

`pnpm add @react-native-community/cli`
`pnpm update`

### Unable to resolve module @babel/runtime/helpers/interopRequireDefault

https://github.com/facebook/react-native/issues/27712#issuecomment-715780864

### Error: jest-haste-map: File to process was not found in the haste map.

We have to find where this bug is coming from. Metro or Jest?
https://github.com/facebook/metro/issues/1#issuecomment-421628147

### plurals error

add `sourceExts: ['js', 'ts', 'tsx', 'mjs']` to metro.config.js

### Migration from yarn

https://dev.to/andreychernykh/yarn-npm-to-pnpm-migration-guide-2n04

### iOS migration

1. Fix paths
2. Error The following Swift pods cannot yet be integrated as static libraries:
   - pod 'GoogleUtilities', :modular_headers => true;
3. Error: An error occurred while processing the post-install hook of the Podfile.
   - Remove post_install hook
