import { BackgroundMessageType } from '@src/background/BackgroundMessageType'

import { debounce } from 'lodash'
import { browser } from 'webextension-polyfill-ts'
import { authierColors } from '../../../shared/chakraCustomTheme'
import type { SessionStoredItem } from '../background/backgroundPage'
import { DOMEventsRecorder, IInputRecord } from './DOMEventsRecorder'
import debug from 'debug'
import { ILoginCredentials } from '@src/util/useBackgroundState'

const log = debug('contentScript')
localStorage.debug = '*' // enable all debug messages

declare global {
  var __AUTHIER__: {
    capturedInputs: IInputRecord[]
    loginCredentials: SessionStoredItem
  }
}

const domRecorder = new DOMEventsRecorder()

const formsRegisteredForSubmitEvent = [] as HTMLFormElement[]

export async function initInputWatch() {
  const modalState = await browser.runtime.sendMessage({
    action: BackgroundMessageType.getLoginCredentialsModalState
  })
  log('~ modalState1', modalState)

  if (modalState && modalState.username && modalState.password) {
    renderSaveCredentialsForm(modalState.username, modalState.password)
    return // the modal is already displayed
  }
  const showSavePromptIfAppropriate = (): void => {
    if (promptDiv) {
      return
    }
    const username = domRecorder.getUsername()
    const password = domRecorder.getPassword()
    if (username && password) {
      renderSaveCredentialsForm(username, password)
    }
  }
  document.addEventListener(
    'input',
    debounce((ev) => {
      const targetElement = ev.target as HTMLInputElement
      if (
        (targetElement && targetElement.type === 'password') ||
        targetElement.type === 'text'
      ) {
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

          log('inputRecord', inputRecord)
          if (targetElement.type === 'password') {
            log('password inputted', inputted)

            const form = targetElement.form
            if (form) {
              if (formsRegisteredForSubmitEvent.includes(targetElement.form)) {
                return
              }
              form.addEventListener(
                'submit',
                (ev) => {
                  log('onsubmit', ev)
                  domRecorder.addInputEvent({
                    element: form,
                    type: 'submit'
                  })
                  showSavePromptIfAppropriate()

                  log(domRecorder)
                },
                { once: true }
              )
              formsRegisteredForSubmitEvent.push(form)
            }

            targetElement.addEventListener(
              'keydown',
              (ev: KeyboardEvent) => {
                if (ev.code === 'Enter') {
                  domRecorder.addInputEvent({
                    element: targetElement,
                    type: 'keydown'
                  })
                  showSavePromptIfAppropriate()
                }
              },
              { once: true }
            )

            // some login flows don't have any forms, in that case we are listening for click, keydown
            document.addEventListener('click', showSavePromptIfAppropriate, {
              once: true
            })
          }
        }
      }
    }, 400),
    true
  )
}

let promptDiv: HTMLDivElement | null

function renderSaveCredentialsForm(username: string, password: string) {
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
    `background-color:${bgColor}; color: ${authierColors.green[100]}; margin: 4px; padding: 4px;border-radius: 4px;`

  const h3Style = '"margin: 0 5px; font-family: sans-serif !important;"'
  promptDiv.innerHTML = `
  <span>Username: </span><h3 style=${h3Style}>${username}</h3>
  <span>Password: </span><h3 id="__AUTHIER__pswdDisplay" style=${h3Style}>${password.replaceAll(
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
  document
    .querySelector('#__AUTHIER__saveBtn')!
    .addEventListener('click', () => {
      const loginCreds = {
        username,
        password,
        capturedInputEvents: domRecorder.toJSON()
      }
      browser.runtime.sendMessage({
        action: BackgroundMessageType.saveLoginCredentials,
        payload: loginCreds
      })
    })
  document
    .querySelector('#__AUTHIER__closeBtn')!
    .addEventListener('click', async () => {
      promptDiv!.remove()
      promptDiv = null

      browser.runtime.sendMessage({
        action: BackgroundMessageType.hideLoginCredentialsModal
      })
    })

  // password show button functionality
  let passwordShown = false
  document
    .querySelector('#__AUTHIER__showPswdBtn')!
    .addEventListener('click', () => {
      const passwordDisplayEl = document.querySelector(
        '#__AUTHIER__pswdDisplay'
      )!
      if (passwordShown) {
        passwordDisplayEl.innerHTML = password.replaceAll(/./g, '*')
        passwordShown = false
      } else {
        passwordDisplayEl.innerHTML = password
        passwordShown = true
      }
    })
}
// showSavePrompt()
initInputWatch()
