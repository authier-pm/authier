// @ts-nocheck
import { h } from 'preact'
import { useState } from 'preact/hooks'
import { popupDiv } from '../renderItemPopup'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

export const PrompItemPopup = ({ inputEvents }: { inputEvents: any }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const addCredential = async (openInVault = false) => {
    const loginCredentials = {
      username,
      password,
      capturedInputEvents: inputEvents.capturedInputEvents,
      openInVault,
      url: inputEvents.inputsUrl ? inputEvents.inputsUrl : ''
    }

    //fill inputs
    inputEvents.capturedInputEvents.forEach((element) => {
      const input = document.body.querySelector(element.element)
      if (input.type === 'password') {
        input.value = password
      } else {
        input.value = username
      }
    })

    return await trpc.addLoginCredentials.mutate(loginCredentials)
  }

  const onInput = (e) => {
    if (e.target.type === 'text') {
      setUsername(e.target.value)
    } else {
      setPassword(e.target.value)
    }
  }

  return (
    <div
      style={{
        zIndex: '2147483647', // max z-index according to stackoverflow
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'baseline',
        fontFamily: 'sans-serif !important',
        position: 'fixed',
        top: '50%',
        left: '50%',
        backgroundColor: '#64cabd'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: '13px', color: 'black' }}>Username: </span>
        <input
          placeholder="username"
          type="text"
          value={username}
          onInput={onInput}
        />
        <span style={{ fontWeight: '13px', color: 'black' }}>Password: </span>
        <input
          type="password"
          placeholder="password"
          value={password}
          onInput={onInput}
        />
        <button
          onClick={() => {
            addCredential()
            popupDiv?.remove()
          }}
        >
          Save
        </button>
      </div>
    </div>
  )
}
