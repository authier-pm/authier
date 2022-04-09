/* eslint-disable react/react-in-jsx-scope */
import { Test } from './components/Test'
import { BackgroundMessageType } from '@src/background/BackgroundMessageType'
import browser from 'webextension-polyfill'
import { authierColors } from '../../../shared/chakraRawTheme'
import { domRecorder } from './contentScript'

import { h, render } from 'nano-jsx/lib/core'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export let promptDiv: HTMLDivElement | null

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
const test = document.createElement('div')
document.body.appendChild(test)
render(<Test />, test)

export function renderSaveCredentialsForm(username: string, password: string) {
  promptDiv = document.createElement('div')

  promptDiv.id = '__AUTHIER__savePrompt'
  promptDiv.style.zIndex = '2147483647' // max z-index according to stackoverflow
  promptDiv.style.display = 'flex'
  promptDiv.style.justifyContent = 'center'
  promptDiv.style.alignItems = 'baseline'
  promptDiv.style.fontFamily = 'sans-serif !important'

  promptDiv.style.width = '100%'
  promptDiv.style.position = 'fixed'
  promptDiv.style.padding = '8px'
  promptDiv.style.backgroundColor = authierColors.green[300]
  promptDiv.style.top = '0px'
  promptDiv.style.left = '0px'
  const buttonStyle = (bgColor: string) =>
    `background-color:${bgColor}; color: ${authierColors.green[100]}; margin: 4px; padding: 4px;border-radius: 4px; font-size: 13px;`

  const h3Style =
    '"margin: 0 5px; font-family: sans-serif !important; font-size: 14px; font-weight: bold; color: #000;"'
  const spanStyle = '"font-size: 13px; color: #000;"'
  promptDiv.innerHTML = `
  <span style=${spanStyle}>Username: </span><h3 style=${h3Style}>${username}</h3>
  <span style=${spanStyle}>Password: </span><h3 id="__AUTHIER__pswdDisplay" style=${h3Style}>${password.replaceAll(
    /./g,
    '*'
  )}</h3>
<button id="__AUTHIER__showPswdBtn" style="${buttonStyle(
    authierColors.teal[100]
  )}" >👁️</button >
 <div style="margin: 0 15px;">

 <button id="__AUTHIER__saveBtn" style="${buttonStyle(
   authierColors.green[500]
 )} min-width=60px;">save</button >
  <button id="__AUTHIER__saveAndEditBtn" style="${buttonStyle(
    authierColors.green[600]
  )} min-width=60px;">save & edit</button >
  <button style="${buttonStyle(
    authierColors.teal[900]
  )}" id="__AUTHIER__closeBtn">close</button >
 </div>
  `

  document.body.appendChild(promptDiv)

  browser.runtime.sendMessage({
    action: BackgroundMessageType.saveLoginCredentialsModalShown,
    payload: {
      username,
      password,
      capturedInputEvents: domRecorder.toJSON()
    }
  })

  function closePrompt() {
    promptDiv!.remove()
    promptDiv = null
  }

  const addCredential = async (openInVault = false) => {
    const loginCredentials = {
      username,
      password,
      capturedInputEvents: domRecorder.toJSON(),
      openInVault
    }
    return browser.runtime.sendMessage({
      action: BackgroundMessageType.addLoginCredentials,
      payload: loginCredentials
    })
  }
  document
    .querySelector('#__AUTHIER__saveBtn')
    ?.addEventListener('click', async () => {
      await addCredential()
      closePrompt()
    })

  document
    .querySelector('#__AUTHIER__saveAndEditBtn')
    ?.addEventListener('click', async () => {
      await addCredential(true)

      closePrompt()
    })
  document
    .querySelector('#__AUTHIER__closeBtn')
    ?.addEventListener('click', async () => {
      closePrompt()

      browser.runtime.sendMessage({
        action: BackgroundMessageType.hideLoginCredentialsModal
      })
    })

  // password show button functionality
  let passwordShown = false
  document
    .querySelector('#__AUTHIER__showPswdBtn')
    ?.addEventListener('click', () => {
      const passwordDisplayEl = document.querySelector(
        '#__AUTHIER__pswdDisplay'
      )!
      if (passwordShown) {
        passwordDisplayEl.innerHTML = password.replaceAll(/./g, '*')
        passwordShown = false
      } else {
        passwordDisplayEl.innerHTML = escapeHtml(password)
        passwordShown = true
      }
    })
}
