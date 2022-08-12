// @ts-nocheck
import { h } from 'preact'
import { authierColors } from '../../../../shared/chakraRawTheme'
import { promptDiv } from '../renderSaveCredentialsForm'
import { BackgroundMessageType } from '../../background/BackgroundMessageType'
//import { css } from '@emotion/css'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export const PromptPassword = ({
  username,
  password,
  inputEvents
}: {
  username: string
  password: string
  inputEvents: any
}) => {
  const h3Style = {
    margin: 0,
    fontFamily: 'sans-serif !important',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#000'
  }

  const spanStyle = {
    fontSize: '13px',
    color: '#000'
  }

  const buttonStyle = (bgColor: string) => {
    return {
      backgroundColor: bgColor,
      margin: '4px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      height: '40px',
      outline: 'none',
      padding: '10px 16px',
      borderDecoration: 'none'
    }
  }
  const addCredential = async (openInVault = false) => {
    const loginCredentials = {
      username,
      password,
      capturedInputEvents: inputEvents.capturedInputEvents,
      openInVault,
      url: inputEvents.inputsUrl ? inputEvents.inputsUrl : ''
    }

    return chrome.runtime.sendMessage(
      {
        action: BackgroundMessageType.addLoginCredentials,
        payload: loginCredentials
      },
      (res) => console.log('popup')
    )
  }

  const removeCredential = async () => {
    promptDiv?.remove()
    return chrome.runtime.sendMessage({
      action: BackgroundMessageType.hideLoginCredentialsModal
    })
  }

  let passwordShown = false

  console.log('nanojsx')
  return (
    <div
      style={{
        zIndex: '2147483647', // max z-index according to stackoverflow
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'baseline',
        fontFamily: 'sans-serif !important',
        width: '100%',
        position: 'fixed',
        padding: '8px',
        backgroundColor: '#64cabd',
        top: '0px'
      }}
    >
      <span style={{ fontWeight: '13px', color: 'black' }}>Username: </span>
      <h3 style={h3Style}>{username}</h3>
      <span style={spanStyle}>Password: </span>{' '}
      <h3 style={h3Style} id="__AUTHIER__pswdDisplay">
        {password.replaceAll(/./g, '*')}
      </h3>
      <button
        style={buttonStyle(authierColors.teal[100])}
        onClick={() => {
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
        }}
      >
        👁️
      </button>
      <div style={{ margin: '0 15px' }}>
        <button
          style={buttonStyle('#57c7e9')}
          onClick={async () => {
            await addCredential()
            promptDiv?.remove()
          }}
        >
          save
        </button>
        <button
          style={buttonStyle('#1EAE9B')}
          onClick={async () => {
            await addCredential(true)
            promptDiv?.remove()
          }}
        >
          save & edit
        </button>
        <button
          style={buttonStyle('#072C27')}
          onClick={() => {
            removeCredential()
          }}
        >
          close
        </button>
      </div>
    </div>
  )
}
