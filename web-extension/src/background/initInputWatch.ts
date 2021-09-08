import type { SessionStoredItem } from './backgroundPage'

export function initInputWatch(credentials?: string) {
  let confirm: boolean
  let loginFields: any = []
  let inputs = document.getElementsByTagName('input')
  for (let j = 0; j < inputs.length; j++) {
    if (inputs[j].type === 'password') {
      loginFields = [inputs[j - 1], inputs[j]]
    }
  }

  let submit = document.querySelector('#submit') // get the button with some diff way

  let username = loginFields[0]
  let password = loginFields[1]

  console.log({ credentials, location })
  console.log(username, password)

  //@ts-expect-error
  if (username && password && credentials.hasData) {
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

    document.body.addEventListener('click', (e) => {
      if (username.value && password.value) {
        const sessionStoredItem: SessionStoredItem = {
          username: username.value,
          password: password.value,
          originalUrl: location.href,
          label: location.hostname,
          willSave: confirm
        }
        console.log('test', sessionStoredItem)

        sessionStorage.setItem('__authier', JSON.stringify(sessionStoredItem))
      }
    })
  }

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