import { BackgroundMessageType } from '@src/background/BackgroundMessageType'

import { debounce } from 'lodash'
import browser from 'webextension-polyfill'
import { authierColors } from '../../../shared/chakraCustomTheme'

import { DOMEventsRecorder, IInputRecord } from './DOMEventsRecorder'
import debug from 'debug'
import { ILoginSecret } from '@src/util/useDeviceState'
import { WebInputType } from '../../../shared/generated/graphqlBaseTypes'
import { onRemoveFromDOM } from './onRemovedFromDOM'

const log = debug('au:contentScript')
localStorage.debug = 'au:*' // enable all debug messages

const inputKindMap = {
  email: WebInputType.EMAIL,
  username: WebInputType.USERNAME
}

export interface IInitStateRes {
  isLoggedIn: boolean
  saveLoginModalsState:
    | {
        password: string
        username: string
      }
    | null
    | undefined
}

// TODO spec
export function getWebInputKind(
  targetElement: HTMLInputElement
): WebInputType | null {
  return (
    (targetElement.type === 'password'
      ? WebInputType.PASSWORD
      : inputKindMap[targetElement.autocomplete]) ?? null
  )
}

const domRecorder = new DOMEventsRecorder()

const formsRegisteredForSubmitEvent = [] as HTMLFormElement[]
export async function initInputWatch() {
  const stateInitRes: IInitStateRes = await browser.runtime.sendMessage({
    action: BackgroundMessageType.getContentScriptInitialState
  })

  const { saveLoginModalsState, isLoggedIn } = stateInitRes
  if (!isLoggedIn) {
    return // no need to do anything
  }

  if (
    saveLoginModalsState &&
    saveLoginModalsState.username &&
    saveLoginModalsState.password
  ) {
    renderSaveCredentialsForm(
      saveLoginModalsState.username,
      saveLoginModalsState.password
    )
    return // the modal is already displayed
  }

  const showSavePromptIfAppropriate = async () => {
    if (promptDiv) {
      return
    }
    const username = domRecorder.getUsername()
    const password = domRecorder.getPassword()
    console.log('~A showSavePromptIfAppropriate', username, password)

    if (password) {
      if (username) {
        renderSaveCredentialsForm(username, password)
      } else {
        const fallbackUsernames: string[] = await browser.runtime.sendMessage({
          action: BackgroundMessageType.getFallbackUsernames
        })
        renderSaveCredentialsForm(fallbackUsernames[0], password)
      }
    }
  }

  let mutationObserver: MutationObserver
  document.addEventListener(
    'input',
    debounce((ev) => {
      const targetElement = ev.target as HTMLInputElement
      const isPasswordType = targetElement.type === 'password'
      if ((targetElement && isPasswordType) || targetElement.type === 'text') {
        const inputted = targetElement.value
        if (inputted) {
          const inputRecord: IInputRecord = {
            element: targetElement,
            eventType: 'input',
            inputted,
            kind: getWebInputKind(targetElement)
          }
          domRecorder.addInputEvent(inputRecord)
          if (inputted.length === 6) {
            // TODO check existing TOTPs and add TOTP web input if we don't have one here
          }

          log('inputRecord', inputRecord)
          if (targetElement.type === 'password') {
            log('password inputted', inputted)

            const form = targetElement.form
            const onSubmit = (element: HTMLInputElement | HTMLFormElement) => {
              domRecorder.addInputEvent({
                element,
                eventType: 'submit',
                kind: WebInputType.PASSWORD
              })
              showSavePromptIfAppropriate()

              log(domRecorder)
            }
            if (form) {
              // handle case when this is inside a form
              if (formsRegisteredForSubmitEvent.includes(targetElement.form)) {
                return
              }

              form.addEventListener(
                'submit',
                () => {
                  onSubmit(form)
                },
                { once: true }
              )
              formsRegisteredForSubmitEvent.push(form)
            }

            // handle when the user uses enter key-custom JS might be listening for keydown as well and trigger submit externally
            targetElement.addEventListener(
              'keydown',
              (ev: KeyboardEvent) => {
                if (ev.code === 'Enter') {
                  domRecorder.addInputEvent({
                    element: targetElement,
                    eventType: 'keydown',
                    kind: null
                  })
                  showSavePromptIfAppropriate()
                }
              },
              { once: true }
            )

            // handle case when input is removed from DOM by javascript
            if (mutationObserver) {
              mutationObserver.disconnect()
            }

            mutationObserver = onRemoveFromDOM(targetElement, () => {
              onSubmit(targetElement)
            })

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

  const addCredential = async () => {
    const loginCredentials = {
      username,
      password,
      capturedInputEvents: domRecorder.toJSON()
    }
    browser.runtime.sendMessage({
      action: BackgroundMessageType.addLoginCredentials,
      payload: loginCredentials
    })
  }
  document
    .querySelector('#__AUTHIER__saveBtn')!
    .addEventListener('click', async () => {
      await addCredential()
      closePrompt()
    })

  document
    .querySelector('#__AUTHIER__saveAndEditBtn')!
    .addEventListener('click', async () => {
      const secret = await addCredential()
      chrome.tabs.create({ url: `vault.html/secret/${secret.id}}` })

      closePrompt()
    })
  document
    .querySelector('#__AUTHIER__closeBtn')!
    .addEventListener('click', async () => {
      closePrompt()

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
