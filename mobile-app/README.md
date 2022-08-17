# mobile

react-native mobile app

## Development

```
yarn

cp .env.sample .env

```

### How to run locally in android emulator

1. run metro bundler
   `yarn start`

2. run android studio and inside

## Known problems

make sure to hard refresh by pressing `r` if you edit a formik form. Formik has problems hot reloading.


## Useful commands

# useful to debug js code errors
`adb logcat "*:S" ReactNative:V ReactNativeJS:V`

# useful to debug native errors (when the app won't even start)
`adb logcat "*:E"`