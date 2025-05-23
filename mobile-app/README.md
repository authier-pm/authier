# mobile

react-native mobile app

## Development

Install dependencies with `pnpm`
Make sure you have your own `.env` file with API key and secrets: `cp env.sample .env`

## Release build

We use Github CI/CD for publishing releases. When you push a tag, it will build and publish the app to the play store.

### Deprecated

in order to build you need `mobile-app/android/local.properties`

Add `local.properties` to `android/` folder with the following content:

```
# local.properties
storePassword=XXXXXXXX
sdk.dir=XXXXXXXX
keyAlias=XXXXXXXX
keyPassword=XXXXXXXX
storeFile=XXXXXXXX
```

if you have this, make sure the storeFile path is correct. Then run `buildRelease`

### How to run locally in android emulator

1. run metro bundler
   `pnpm start`

2. hit `a` for android

### How to run for ios

1. install pods with `pnpm pod:install`
2. run metro `pnpm start` and hit `i` for iOS

## Known problems

make sure to hard refresh by pressing `r` if you edit a formik form. Formik has problems hot reloading.

# Useful commands

### useful to debug js code errors

`adb logcat "*:S" ReactNative:V ReactNativeJS:V`

### useful to debug native errors (when the app won't even start)

`adb logcat "*:E"`

### When you have problem with dependencies

`npx react-native-clean-project`

### Could not connect to server

reverse ports with `adb reverse tcp:**** tcp:****` or use https://stackoverflow.com/a/2235255/671457

### error Failed to install the app

Sometimes you need to copy the react native dependency from root to mobile folder. So run this command from `mobile-app`

```
cp -r ../node_modules/react-native/ ./node_modules
```

## TODO

- https://f-droid.org/en/ publish here
