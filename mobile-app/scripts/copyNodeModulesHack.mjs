#!/usr/bin/env zx

// This script is a hack to copy node_modules from the root of the project because react-native sucks

import { existsSync } from 'fs'

if (existsSync(`../node_modules/jsc-android`)) {
  await $`cp -R ../node_modules/jsc-android/ ./node_modules/jsc-android`
}
if (existsSync(`../node_modules/react-native/`)) {
  await $`cp -R ../node_modules/react-native/ ./node_modules/react-native`
}
await $`cp -R ../node_modules/react-native-code-push/ ./node_modules/react-native-code-push`
await $`mkdir -p ./node_modules/.bin`
if (existsSync(`../node_modules/.bin/react-native`)) {
  await $`cp -R ../node_modules/.bin/react-native ./node_modules/.bin/react-native`
}
