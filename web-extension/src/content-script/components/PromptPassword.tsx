import { h } from 'preact'
import { useState } from 'preact/hooks'
import type { ReactNode } from 'react'
import browser from 'webextension-polyfill'

import { ICapturedInput } from '../../background/backgroundPage'
import { trpc } from '../connectTRPC'
import { loginPrompt } from '../renderSaveCredentialsForm'
import { authierOverlayBaseStyles } from './authierOverlayStyles'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nano = h

const savePromptStyles = `
  ${authierOverlayBaseStyles}

  .authier-save-card {
    background: #111827;
    border: 1px solid #334155;
    border-radius: 18px;
    box-shadow: 0 20px 56px rgba(0, 0, 0, 0.44);
    color: #f8fafc;
    padding: 16px;
    position: fixed;
    right: 16px;
    top: 16px;
    width: min(380px, calc(100vw - 32px));
  }

  .authier-save-card__header {
    align-items: flex-start;
    display: flex;
    gap: 12px;
  }

  .authier-save-card__mark {
    align-items: center;
    background: #0f73ff;
    border-radius: 12px;
    display: flex;
    flex: 0 0 auto;
    height: 38px;
    object-fit: contain;
    padding: 7px;
    width: 38px;
  }

  .authier-save-card__title-group {
    flex: 1;
    min-width: 0;
  }

  .authier-save-card__title {
    color: #ffffff;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.25;
    margin: 0;
  }

  .authier-save-card__subtitle {
    color: #94a3b8;
    font-size: 12px;
    margin: 3px 0 0;
  }

  .authier-save-card__credentials {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    margin-top: 14px;
    overflow: hidden;
  }

  .authier-save-card__row {
    align-items: center;
    display: grid;
    gap: 10px;
    grid-template-columns: 70px minmax(0, 1fr) auto;
    min-height: 42px;
    padding: 8px 10px;
  }

  .authier-save-card__row + .authier-save-card__row {
    border-top: 1px solid #334155;
  }

  .authier-save-card__label {
    color: #94a3b8;
    font-size: 12px;
    font-weight: 600;
  }

  .authier-save-card__value {
    color: #f8fafc;
    font-size: 13px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .authier-save-card__value--password {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      monospace;
    letter-spacing: 0.04em;
  }

  .authier-save-card__reveal {
    all: unset;
    border-radius: 8px;
    box-sizing: border-box;
    color: #60a5fa;
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;
    padding: 5px 7px;
  }

  .authier-save-card__reveal:hover {
    background: #334155;
    color: #bfdbfe;
  }

  .authier-save-card__reveal:focus-visible {
    outline: 3px solid rgba(96, 165, 250, 0.45);
    outline-offset: 1px;
  }

  .authier-save-card__actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 14px;
  }

  @media (max-width: 420px) {
    .authier-save-card {
      left: 12px;
      right: 12px;
      top: 12px;
      width: auto;
    }

    .authier-save-card__actions {
      flex-wrap: wrap;
    }
  }
`

const CredentialRow = ({
  action,
  label,
  password,
  value
}: {
  action?: ReactNode
  label: string
  password?: boolean
  value: string
}) => (
  <div className="authier-save-card__row">
    <span className="authier-save-card__label">{label}</span>
    <span
      className={`authier-save-card__value${
        password ? ' authier-save-card__value--password' : ''
      }`}
      title={value}
    >
      {value}
    </span>
    {action ?? <span />}
  </div>
)

/** A compact prompt for saving credentials to Authier. */
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
  const [isHidden, setIsHidden] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const usernameDisplay = username ?? 'Not captured'

  const addCredential = async (openInVault = false) => {
    await trpc.addLoginCredentials.mutate({
      capturedInputEvents: inputEvents.capturedInputEvents,
      openInVault,
      username,
      password
    })
  }

  const saveCredential = async (openInVault = false) => {
    setIsSaving(true)
    await addCredential(openInVault)
    loginPrompt?.remove()
    setIsSaving(false)
  }

  const dismiss = async () => {
    loginPrompt?.remove()
    await trpc.hideLoginCredentialsModal.mutate()
  }

  return (
    <>
      <style>{savePromptStyles}</style>
      <section
        aria-label="Save login to Authier"
        className="authier-save-card authier-surface"
        role="dialog"
      >
        <header className="authier-save-card__header">
          <img
            alt=""
            className="authier-save-card__mark"
            src={browser.runtime.getURL('icon-128.png')}
          />
          <div className="authier-save-card__title-group">
            <h2 className="authier-save-card__title">Save this login?</h2>
            <p className="authier-save-card__subtitle">
              Keep these credentials in your Authier vault.
            </p>
          </div>
          <button
            aria-label="Dismiss save login prompt"
            className="authier-icon-button"
            onClick={dismiss}
            type="button"
          >
            ✕
          </button>
        </header>

        <div className="authier-save-card__credentials">
          <CredentialRow label="Username" value={usernameDisplay} />
          <CredentialRow
            action={
              <button
                aria-label={isHidden ? 'Show password' : 'Hide password'}
                className="authier-save-card__reveal"
                onClick={() => setIsHidden((hidden) => !hidden)}
                type="button"
              >
                {isHidden ? 'Show' : 'Hide'}
              </button>
            }
            label="Password"
            password
            value={isHidden ? '•'.repeat(password.length) : password}
          />
        </div>

        <div className="authier-save-card__actions">
          <button
            className="authier-button authier-button--secondary"
            disabled={isSaving}
            onClick={() => saveCredential(true)}
            type="button"
          >
            Save &amp; edit
          </button>
          <button
            className="authier-button authier-button--primary"
            disabled={isSaving}
            onClick={() => saveCredential()}
            type="button"
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </section>
    </>
  )
}
