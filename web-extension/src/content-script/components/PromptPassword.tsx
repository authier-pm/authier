// @ts-nocheck
import { h } from 'preact'
import { authierColors } from '../../../../shared/chakraRawTheme'
import { loginPrompt } from '../renderSaveCredentialsForm'

import { ICapturedInput } from '../../background/backgroundPage'
import browser from 'webextension-polyfill'
import { getTRPCCached } from '../connectTRPC'

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
  inputEvents,
  passwordLimit,
  passwordCount
}: {
  username: string
  password: string
  inputEvents: {
    capturedInputEvents: ICapturedInput[]
    inputsUrl: any
  }

  passwordLimit: number
  passwordCount: number
}) => {
  const trpc = getTRPCCached()

  const h3Style = {
    margin: 0,
    fontFamily: 'sans-serif !important',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#000'
  }

  const spanStyle = {
    fontSize: '13px',
    color: '#000',
    marginRight: '8px'
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
    if (passwordCount >= passwordLimit) {
      alert(
        'You have reached the maximum number of passwords allowed in your vault. Please delete some passwords to add more.'
      )

      return await trpc.hideLoginCredentialsModal.mutate()
    }

    const loginCredential = {
      capturedInputEvents: inputEvents.capturedInputEvents,
      openInVault,
      username,
      password
    }

    await trpc.addLoginCredentials.mutate(loginCredential)
  }

  const removeCredential = async () => {
    loginPrompt?.remove()
    await trpc.hideLoginCredentialsModal.mutate()
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
            loginPrompt?.remove()
          }}
        >
          save
        </button>
        <button
          style={buttonStyle('#1EAE9B')}
          onClick={async () => {
            await addCredential(true)
            loginPrompt?.remove()
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
