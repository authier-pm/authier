#!/usr/bin/env zx

// This script is a hack to copy node_modules from the root of the project because react-native sucks

const jscAndroidExists = await $`ls ../node_modules/jsc-android`
if (jscAndroidExists) {
  await $`cp -R ../node_modules/jsc-android/ ./node_modules/jsc-android`
}
await $`cp -R ../node_modules/react-native/ ./node_modules/react-native`
await $`cp -R ../node_modules/react-native-code-push/ ./node_modules/react-native-code-push`
//await $`cp -R ../node_modules/.bin/react-native ./node_modules/.bin/react-native`
