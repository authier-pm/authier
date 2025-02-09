import { h } from 'preact'
import { authierColors } from '../../../../shared/chakraRawTheme'
import { loginPrompt } from '../renderSaveCredentialsForm'

import { ICapturedInput } from '../../background/backgroundPage'
import debug from 'debug'
import { trpc } from '../connectTRPC'
import { useState } from 'preact/hooks'

const log = debug('au:PromptPassword')

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

/**
 * a prompt alert for saving credentials to authier
 */
export const PromptPassword = ({
  username,
  password,
  inputEvents
}: {
  username: string | null
  password: string
  inputEvents: {
    capturedInputEvents: ICapturedInput[]
    inputsUrl: string
  }
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

  const [isHidden, setIsHidden] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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
      <h3 style={h3Style}>
        {isHidden ? password.replaceAll(/./g, '*') : password}
      </h3>
      <button
        style={buttonStyle(authierColors.teal[100])}
        onClick={() => {
          setIsHidden(!isHidden)
        }}
      >
        {isHidden ? '👁️' : '❌'}
      </button>
      <div style={{ margin: '0 15px' }}>
        <button
          style={buttonStyle('#57c7e9')}
          onClick={async () => {
            setIsSaving(true)
            await addCredential()
            loginPrompt?.remove()
            setIsSaving(false)
          }}
        >
          {isSaving ? 'saving...' : 'save'}
        </button>
        <button
          style={buttonStyle('#1EAE9B')}
          onClick={async () => {
            setIsSaving(true)
            await addCredential(true)
            loginPrompt?.remove()
            setIsSaving(false)
          }}
        >
          save & edit
        </button>
        <button
          style={{
            ...buttonStyle('#263734'),
            color: 'white'
          }}
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
