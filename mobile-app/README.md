# mobile

react-native mobile app

## Development
Install dependencies with `yarn`
Make sure you have your own `.env` file with API key and secrets: `cp env.sample .env`

Add `local.properties` to `android/` folder with the following content:

```
# local.properties
storePassword=XXXXXXXX
sdk.dir=XXXXXXXX
keyAlias=XXXXXXXX
keyPassword=XXXXXXXX
storeFile=XXXXXXXX
```


### How to run locally in android emulator

1. run metro bundler
   `yarn start`

2. run android studio and inside

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