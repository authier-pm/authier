import { BackgroundMessageType } from '@src/background/BackgroundMessageType'
import { getCssSelector } from 'css-selector-generator'
import { debounce } from 'lodash'
import { browser } from 'webextension-polyfill-ts'
import type { SessionStoredItem } from '../background/backgroundPage'
import { DOMEventsRecorder, IInputRecord } from './DOMEventsRecorder'

declare global {
  var __AUTHIER__: {
    capturedInputs: IInputRecord[]
    loginCredentials: SessionStoredItem
  }
}

const domRecorder = new DOMEventsRecorder()

const formsRegisteredForSubmitEvent = [] as HTMLFormElement[]

export function initInputWatch() {
  console.log('~ initInputWatch2456')
  document.addEventListener(
    'input',
    debounce((ev) => {
      const targetElement = ev.target as HTMLInputElement
      if (targetElement) {
        const inputted = targetElement.value
        if (inputted) {
          const inputRecord: IInputRecord = {
            element: targetElement,
            type: 'input',
            inputted
          }
          domRecorder.addInputEvent(inputRecord)
          if (inputted.length === 6) {
            // TODO check
          }

          console.log('inputRecord', inputRecord)
          if (targetElement.type === 'password') {
            console.log('password inputted', inputted)

            const form = targetElement.form
            if (form) {
              if (formsRegisteredForSubmitEvent.includes(targetElement.form)) {
                return
              }
              form.addEventListener('submit', (ev) => {
                console.log('onsubmit', ev)
                domRecorder.addInputEvent({
                  element: form,
                  type: 'submit'
                })
                const username = domRecorder.getUsername()
                const password = domRecorder.getPassword()
                if (username && password) {
                  showSavePrompt(username, password)
                }

                console.log(domRecorder)
              })
              formsRegisteredForSubmitEvent.push(form)
            }
          }
        }
      }
    }, 400),
    true
  )
}

let promptDiv: HTMLDivElement | null

function showSavePrompt(username: string, password: string) {
  if (promptDiv) {
    return
  }
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
  promptDiv.style.backgroundColor = '#74E7D8'
  promptDiv.style.top = '0px'
  promptDiv.style.left = '0px'
  const buttonStyle = (bgColor: string) =>
    `background-color:${bgColor}; color: #C2F5EE; margin: 4px; padding: 4px;border-radius: 4px;`

  const h3Style = '"margin: 0 5px; font-family: sans-serif !important;"'
  promptDiv.innerHTML = `
  <span>Username: </span><h3 style=${h3Style}>${username}</h3>
  <span>Password: </span><h3 style=${h3Style}>${password.replaceAll(
    /./g,
    '*'
  )}</h3>
<button id="__AUTHIER__showPswdBtn" style="${buttonStyle(
    '#C3F3F3'
  )}" >👁️</button >
 <div style="margin: 0 15px;">

 <button id="__AUTHIER__saveBtn" style="${buttonStyle(
   '#25DAC2'
 )} min-width=60px;">save</button >
  <button style="${buttonStyle(
    '#082B2A'
  )}" id="__AUTHIER__closeBtn">close</button >
 </div>
    `

  document.body.appendChild(promptDiv)
  document
    .querySelector('#__AUTHIER__saveBtn')!
    .addEventListener('click', () => {
      browser.runtime.sendMessage({
        action: BackgroundMessageType.saveLoginCredentials,
        payload: {
          username,
          password,
          capturedInputEvents: domRecorder.capturedInputEvents
        }
      })
    })
  document
    .querySelector('#__AUTHIER__closeBtn')!
    .addEventListener('click', () => {
      promptDiv!.remove()
      promptDiv = null
    })
}
// showSavePrompt()
initInputWatch()
