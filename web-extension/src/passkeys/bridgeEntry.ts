import browser from 'webextension-polyfill'
import { installPasskeyBridge } from './bridge'

installPasskeyBridge((message) => browser.runtime.sendMessage(message))
