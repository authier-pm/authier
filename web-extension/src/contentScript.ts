// import * from 'module'
// TODO
import { getCssSelector } from 'css-selector-generator'
import type { SessionStoredItem } from './background/backgroundPage'

interface IInputRecord {
  cssPath: string
  inputted: string
}

declare global {
  var __AUTHIER__: {
    capturedInputs: IInputRecord[]
    loginCredentials: SessionStoredItem
  }
}

export function initInputWatch() {
  if (window.__AUTHIER__) {
    return
  }
  // @ts-expect-error
  window.__AUTHIER__ = {
    capturedInputs: []
  }
  console.log('~ initInputWatch2')
  document.addEventListener(
    'input',
    (ev) => {
      let selector = getCssSelector(ev.target)
      if (selector.match(/\d+/)) {
        selector = getCssSelector(ev.target, { blacklist: [selector] })
      }
      const inputted = ev?.target?.value
      const inputRecord = {
        cssPath: selector,
        inputted
      }
      return console.log('input', inputRecord)
    },
    true
  )

  //@ts-expect-error
  if (username && password && !credentials.hasData) {
    //@ts-expect-error
    if (!credentials.username) {
      let div = document.createElement('div')
      div.style.height = '42%'
      div.style.width = '100%'
      div.style.position = 'fixed'
      div.style.top = '0px'
      div.style.left = '0px'
      div.style.padding = '0px'

      let saveButton = document.createElement('button')
      saveButton.id = 'save'
      saveButton.textContent = 'save'
      saveButton.onclick = function () {
        confirm = true
        console.log('save', confirm)
        div.remove()
      }
      div.appendChild(saveButton)

      let closeButton = document.createElement('button')
      closeButton.id = 'close'
      closeButton.textContent = 'close'
      closeButton.onclick = function () {
        confirm = false
        console.log('close', confirm)
        div.remove()
      }
      div.appendChild(closeButton)

      document.body.appendChild(div)
    }
  }

  // document.body.addEventListener('click', (e) => {
  //   if (username.value && password.value) {
  //     const sessionStoredItem: SessionStoredItem = {
  //       username: username.value,
  //       password: password.value,
  //       originalUrl: location.href,
  //       label: location.hostname,
  //       willSave: confirm
  //     }
  //     console.log('test', sessionStoredItem)
  //     __AUTHIER__.loginCredentials = sessionStoredItem
  //   }
  // })

  //@ts-expect-error
  if (credentials.username) {
    // TODO fill password & username
    //@ts-expect-error
    username.value = credentials.username
    //@ts-expect-error
    password.value = credentials.password

    //@ts-expect-error
    if (credentials.noHandsLogin && submit) {
      //@ts-expect-error
      submit.click()
    }
  }
}

initInputWatch()
