import jwtDecode from "jwt-decode"
import { browser } from "webextension-polyfill-ts"

export let accessToken = ''
export let tokenFromLocalStorage = async () => {
  let obj = await browser.storage.local.get("jid")
  
  return obj.jid
}


export const setAccessToken = (s: string) => {
  accessToken = s
}

export const getAccessToken = () => {
  return accessToken
}

export const getUserFromToken = async () => {
  return jwtDecode(await tokenFromLocalStorage())
}
