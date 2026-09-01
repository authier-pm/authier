import { bodyInputChangeEmitter } from './domMutationObserver'
import debug from 'debug'
import { generate } from 'generate-password'
import { isElementVisibleInViewport } from './isElementInViewport'
import { domRecorder, getWebInputKind, IInitStateRes } from './contentScript'
import { WebInputType } from '../../../shared/generated/graphqlBaseTypes'
import 'notyf/notyf.min.css'
import { debounce } from 'lodash'
import { renderLoginCredOption } from './renderLoginCredOption'

import {
  ILoginSecret,
  ITOTPSecret,
  LoginCredentialsTypeWithMeta
} from '../util/useDeviceState'

import { trpc } from './connectTRPC'
import { getAllVisibleTextOnDocumentBody } from './getAllVisibleTextOnDocumentBody'
import { renderSaveCredentialsForm } from './renderSaveCredentialsForm'

import browser from 'webextension-polyfill'
import {
  generateQuerySelectorForOrphanedElement,
  getSelectorForElement
} from './cssSelectorGenerators'
import { notyf } from './notyf'
import {
  WebInputForAutofill,
  WebInputsArrayClientSide
} from '../background/WebInputForAutofill'
import { wait } from './wait'
import {
  filterUselessInputs,
  getAllInputsIncludingShadowDom
} from './getAllInputsIncludingShadowDom'
import {
  classifyPageForAutofill,
  classifyPasswordForm,
  PasswordFormClassification,
  PasswordFormKind
} from './classifyPasswordForm'
import {
  isStoredPasswordAutofillTarget,
  selectStoredPasswordAutofillTarget
} from './storedPasswordAutofillPolicy'
import { renderPasswordGenerator } from './renderPasswordGenerator'
import {
  findSegmentedOtpInputs,
  findSingleOtpInput,
  isLikelyOtpField,
  pickWholeCodeEntryBox
} from './findOtpInputs'
import {
  appendGeneratedPasswordHistoryEntry,
  createGeneratedPasswordHistoryEntry
} from '@src/util/generatedPasswordHistory'
import { generateTotpTokenSync } from '@shared/totp'

const log = debug('au:autofill')

export type IDecryptedSecrets = {
  loginCredentials: ILoginSecret[]
  totpSecrets: ITOTPSecret[]
}

export const autofillEventsDispatched = new Set()

function safeGenerateTotpCode(totpSecret: ITOTPSecret) {
  const otpCode = generateTotpTokenSync({ secret: totpSecret.totp.secret })

  if (otpCode === null) {
    log('failed to generate totp code')
  }

  return otpCode
}

const markTotpFilled = (inputs: HTMLInputElement[]) => {
  inputs.forEach((el) => filledElements.add(el))
  inputTypesFilledForThisPage.add(WebInputType.TOTP)
  notyf.success('Autofilled 2FA code')
}

/**
 * Pastes the whole code into a code widget.
 *
 * Several widgets never look at their boxes' `input` events at all - Bitfinex
 * renders the boxes as pure display and accumulates the code from a `paste`
 * listener on `document` plus a `keydown` listener on `window`, and Coinbase
 * calls preventDefault() on every keydown except the paste chord. Both do
 * handle a paste carrying the full code, as does Revolut.
 *
 * A synthetic paste never inserts text by itself - the browser gives untrusted
 * paste events no default action - so this only does anything when the page has
 * its own paste handler. That is exactly the case we cannot reach otherwise.
 */
const tryPasteWholeCode = (target: HTMLInputElement, totpCode: string) => {
  if (
    typeof DataTransfer === 'undefined' ||
    typeof ClipboardEvent === 'undefined'
  ) {
    return false
  }

  try {
    const clipboardData = new DataTransfer()
    clipboardData.setData('text/plain', totpCode)
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData,
      bubbles: true,
      cancelable: true
    })

    target.focus()
    autofillEventsDispatched.add(pasteEvent)
    target.dispatchEvent(pasteEvent)
    return true
  } catch (error) {
    log('could not dispatch a synthetic paste', error)
    return false
  }
}

/**
 * Fills a one-time code into whatever shape the page uses for it: a row of digit
 * boxes, or the single field that most sites - and every widget that paints fake
 * boxes over one real input - actually ship.
 */
async function fillTotpCode(
  usefulInputs: HTMLInputElement[],
  totpCode: string
) {
  const segmented = findSegmentedOtpInputs(usefulInputs, totpCode.length)
  if (
    segmented &&
    (await fillSegmentedTotpInputs(segmented.inputs, totpCode))
  ) {
    return true
  }

  const single = findSingleOtpInput(usefulInputs, totpCode.length)
  if (single && autofillValueIntoInput(single.input, totpCode)) {
    markTotpFilled([single.input])
    return true
  }

  return false
}

async function fillSegmentedTotpInputs(
  inputs: HTMLInputElement[],
  totpCode: string
) {
  // one box per digit, or we would leave the widget in a half filled state
  if (inputs.length !== totpCode.length) {
    return false
  }

  const isFullyFilled = () => inputs.every((el) => el.value !== '')

  // when the widget designates a box for the whole code, one write there lets
  // it spread the digits itself, which is far more reliable than racing it
  const entryBox = pickWholeCodeEntryBox(inputs, totpCode.length)
  if (entryBox && autofillValueIntoInput(entryBox, totpCode)) {
    await Promise.resolve()

    if (isFullyFilled()) {
      log('widget distributed the code from its entry box')
      markTotpFilled(inputs)
      return true
    }

    log('entry box did not distribute, trying a paste')
    filledElements.delete(entryBox)
  }

  // widgets that drive their boxes from a paste handler rather than from the
  // boxes' own input events only respond to this
  if (tryPasteWholeCode(inputs[0], totpCode)) {
    await Promise.resolve()

    if (isFullyFilled()) {
      log('widget accepted the code as a paste')
      markTotpFilled(inputs)
      return true
    }

    log('paste did not take, falling back to one box at a time')
  }

  const digits = totpCode.split('')
  let filledAny = false

  for (let index = 0; index < inputs.length; index++) {
    const box = inputs[index]
    box.focus()
    /**
     * Widgets move focus to the next box as soon as one accepts a character.
     * Writing the whole row synchronously races that, and every box ends up
     * holding the same digit - see bitwarden/clients#11076.
     */
    await Promise.resolve()

    const el = autofillValueIntoInput(box, digits[index])
    if (el) {
      filledElements.add(el)
      filledAny = true
    }
  }

  if (filledAny) {
    markTotpFilled(inputs.filter((el) => el.value !== ''))
  }

  return filledAny
}

/**
 * triggered when page contains 2 or more useful inputs
 * @param usefulInputs
 */
export async function handleGeneratedPasswordAutofill(
  password: string,
  options: {
    passwordInput?: HTMLInputElement
    showSavePrompt: boolean
  }
) {
  await appendGeneratedPasswordHistoryEntry(
    createGeneratedPasswordHistoryEntry({
      pageUrl: window.location.href,
      password
    })
  )

  let capturedUsername: string | null = null
  if (options.passwordInput) {
    const classification = classifyPasswordForm(options.passwordInput)
    const usernameInput = classification.usernameInput
    const username = usernameInput?.value.trim()

    if (usernameInput && username) {
      capturedUsername = username
      domRecorder.addInputEvent({
        element: usernameInput,
        eventType: 'input',
        inputted: username,
        kind: getWebInputKind(usernameInput)
      })
    }

    const livePasswordInput = options.passwordInput.isConnected
      ? options.passwordInput
      : (classification.newPasswordInputs[0] ?? options.passwordInput)
    domRecorder.addInputEvent({
      element: livePasswordInput,
      eventType: 'input',
      inputted: password,
      kind: WebInputType.PASSWORD
    })

    await trpc.saveCapturedInputEvents.mutate({
      inputEvents: domRecorder.toJSON(),
      url: document.documentURI
    })
    capturedUsername = capturedUsername ?? domRecorder.getUsername() ?? null
  }

  if (options.showSavePrompt) {
    await renderSaveCredentialsForm(capturedUsername, password)
  }
}

/**
 * Handles pages that ask for a brand new password - signup forms and
 * change-password forms. We never type a password here on our own: filling a
 * "new password" field unprompted is how a user ends up with their password
 * silently changed while editing their profile. Instead we offer the generator
 * and let the click come from the user.
 *
 * @returns true when this page wants a new password, which aborts the rest of autofill
 */
function handleNewPasswordCase(classification: PasswordFormClassification) {
  if (
    classification.kind !== PasswordFormKind.SIGNUP &&
    classification.kind !== PasswordFormKind.CHANGE_PASSWORD
  ) {
    return false
  }

  const targetInput = classification.newPasswordInputs[0]
  if (targetInput) {
    log('offering the password generator for', classification.kind)
    renderPasswordGenerator({ input: targetInput })
  }

  return true
}

function imitateKeyInput(el: HTMLInputElement, input: string) {
  const setNativeInputValue = (
    targetEl: HTMLInputElement,
    nextValue: string
  ) => {
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )?.set

    if (valueSetter) {
      valueSetter.call(targetEl, nextValue)
      return
    }

    targetEl.value = nextValue
  }

  const dispatchTextInputEvent = (
    targetEl: HTMLInputElement,
    key: string | null
  ) => {
    if (typeof InputEvent !== 'undefined') {
      const event = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        composed: true,
        data: key,
        inputType: key ? 'insertText' : 'insertReplacementText'
      })
      autofillEventsDispatched.add(event)
      targetEl.dispatchEvent(event)
      return
    }

    const event = new Event('input', { bubbles: true })
    autofillEventsDispatched.add(event)
    targetEl.dispatchEvent(event)
  }

  if (el) {
    if (el.value === input) {
      return
    }

    if (el.value !== '') {
      el.value = '' // reset if there is already some value
    }
    const dispatchAutofillEvent = (ev) => {
      autofillEventsDispatched.add(ev)
      el.dispatchEvent(ev)
    }
    // dispatch focus event

    for (let i = 0; i < input.length; i++) {
      const key = input[i]
      const keyboardEventInit = {
        bubbles: true,
        cancelable: true,
        composed: true,

        key: key,
        keyCode: key.charCodeAt(0),
        location: 0
      }
      const keyDown = new KeyboardEvent('keydown', keyboardEventInit)

      dispatchAutofillEvent(keyDown)

      const keyPress = new KeyboardEvent('keypress', keyboardEventInit)

      dispatchAutofillEvent(keyPress)

      const keyUp = new KeyboardEvent('keyup', keyboardEventInit)

      dispatchAutofillEvent(keyUp)
      setNativeInputValue(el, `${el.value}${key}`)

      /**
       * input before change, the order a real browser uses. The other way round
       * the change event consumes React's value-tracker delta, so the InputEvent
       * that follows is a no-op and handlers reading inputType see nothing.
       */
      dispatchTextInputEvent(el, key)

      const change = new Event('change', { bubbles: true })
      dispatchAutofillEvent(change)
      // await sleep(2) // this is to make it a bit more realistic
    }

    // blur does not bubble, and React maps onBlur from focusout - dispatch both
    // so validation-on-blur pages like coinmate.io still fire
    dispatchAutofillEvent(new Event('blur', { bubbles: false }))
    dispatchAutofillEvent(new Event('focusout', { bubbles: true }))
  } else {
    console.error('el is null')
  }
}

export const autofillValueIntoInput = (
  element: HTMLInputElement,
  value: string
) => {
  log('autofillValueIntoInput:', value, element)

  if (filledElements.has(element)) {
    if (element.value === value) {
      return null
    }

    // Controlled inputs can be cleared by a framework re-render while keeping
    // the same DOM node. Let the next input-added/attribute mutation retry it.
    filledElements.delete(element)
  }
  if (element.childNodes.length > 0) {
    //we should again loop through the children of the element and find the right input
    //@ts-ignore
    imitateKeyInput(element.childNodes[0], value)
    filledElements.add(element)
  }

  if (!isElementVisibleInViewport(element)) {
    log('input is not visible in viewport, skipping autofill')
    return null // could be dangerous to autofill into a hidden element-if the website got hacked, someone could be using this: https://websecurity.dev/password-managers/autofill/
  }

  browser.storage.local.set({
    // used for multi-step password autofill later
    lastAutofilledValue: value
  })
  imitateKeyInput(element, value)
  filledElements.add(element)

  return element
}

const GENERATED_PASSWORD_FILL_ATTEMPTS = 2
const GENERATED_PASSWORD_IDENTITY_ATTRIBUTES = [
  'aria-label',
  'autocomplete',
  'id',
  'name',
  'placeholder'
] as const

export const resolveLiveGeneratedPasswordInput = (
  initialInput: HTMLInputElement
) => {
  if (
    initialInput.type === 'password' &&
    isElementVisibleInViewport(initialInput)
  ) {
    return initialInput
  }

  const candidates = getAllInputsIncludingShadowDom(document.body).filter(
    (candidate) =>
      candidate.type === 'password' &&
      !candidate.disabled &&
      !candidate.readOnly &&
      isElementVisibleInViewport(candidate)
  )
  const identityMatch = candidates.find((candidate) =>
    GENERATED_PASSWORD_IDENTITY_ATTRIBUTES.some((attribute) => {
      const initialValue = initialInput.getAttribute(attribute)
      return (
        Boolean(initialValue) &&
        candidate.getAttribute(attribute) === initialValue
      )
    })
  )
  if (identityMatch) {
    return identityMatch
  }

  const classification = classifyPageForAutofill(candidates, document.body)
  return classification.newPasswordInputs[0] ?? null
}

/**
 * Fills and verifies a generated password against the current live input. Some
 * controlled forms replace their input during the first synthetic input event,
 * so a successful write to the original detached node is not enough.
 */
export const fillGeneratedPasswordIntoInput = async (
  initialInput: HTMLInputElement,
  password: string
) => {
  for (let attempt = 0; attempt < GENERATED_PASSWORD_FILL_ATTEMPTS; attempt++) {
    const currentInput = resolveLiveGeneratedPasswordInput(initialInput)
    if (!currentInput) {
      return null
    }

    autofillValueIntoInput(currentInput, password)
    await wait(0)

    const verifiedInput = resolveLiveGeneratedPasswordInput(currentInput)
    if (verifiedInput?.value === password) {
      return verifiedInput
    }

    filledElements.delete(currentInput)
  }

  return null
}

export const fillStringIntoInput = ({
  inputEl,
  loginCredential,
  inputType
}: {
  inputEl: HTMLInputElement
  loginCredential: LoginCredentialsTypeWithMeta

  inputType: WebInputType
}) => {
  if (inputTypesFilledForThisPage.has(inputType)) {
    const hasLiveFilledInput = Array.from(filledElements).some(
      (element) =>
        element.isConnected &&
        element.value !== '' &&
        element.type === inputEl.type
    )

    if (hasLiveFilledInput) {
      log(`inputType ${inputType} already filled for this page`)
      return
    }

    // Some apps replace their password input during hydration. The old node is
    // no longer useful and must not prevent filling the replacement.
    inputTypesFilledForThisPage.delete(inputType)
  }

  const el = autofillValueIntoInput(inputEl, loginCredential.password)

  if (el) {
    inputTypesFilledForThisPage.add(inputType)
  }

  el &&
    notyf.success(
      `Autofilled password for ${
        loginCredential.username
      } into element ${generateQuerySelectorForOrphanedElement(el)}`
    )

  return el
}

export const getElementCoordinates = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect()
  return {
    x: rect.x,
    y: rect.y
  }
}

let onInputAddedHandler = (inputEl: any) => {}

/**
 * tracks which input types have been autofilled for this page, so we don't autofill them again
 */
export const inputTypesFilledForThisPage = new Set<WebInputType>()

/**
 * tracks autofilled elements, so we don't autofill them again. We clear this set when user decides to autofill again with different credentials
 */
export const filledElements = new Set<HTMLInputElement>()

export const resetAutofillStateForThisPage = () => {
  for (const el of filledElements) {
    el.value = ''
  }
  inputTypesFilledForThisPage.clear()
  filledElements.clear()
}

export const autofill = (initState: IInitStateRes) => {
  const { secretsForHost, webInputs } = initState

  log('init autofill', initState)

  const firstLoginCred = secretsForHost.loginCredentials[0]
  const totpSecret = secretsForHost.totpSecrets[0]
  log('autofill secrets snapshot', {
    loginCredentialsCount: secretsForHost.loginCredentials.length,
    totpSecretsCount: secretsForHost.totpSecrets.length,
    hasTotpSecret: Boolean(totpSecret)
  })

  /**
   * Our fallback whenever we refuse to autofill - the user gets the Authier icon
   * next to the password field and fills with a single click.
   */
  const offerCredentialPicker = (
    classification: PasswordFormClassification
  ) => {
    if (secretsForHost.loginCredentials.length === 0) {
      return
    }

    const anchorInput =
      classification.currentPasswordInput ?? classification.usernameInput
    if (!anchorInput) {
      return
    }

    const selector = getSelectorForElement(anchorInput)
    renderLoginCredOption({
      loginCredentials: secretsForHost.loginCredentials,
      webInputs: [
        {
          createdAt: new Date().toString(),
          domPath: selector.css,
          domOrdinal: selector.domOrdinal,
          host: location.host,
          url: location.href,
          kind:
            anchorInput.type === 'password'
              ? WebInputType.PASSWORD
              : WebInputType.USERNAME_OR_EMAIL
        }
      ]
    })
  }

  //NOTE: scan all inputs
  /**
   *
   * @returns array of all useful inputs on the page
   */
  const scanKnownWebInputsAndFillWhenFound = async () => {
    const { body } = document
    /**
     * filter text, email, password, tel
     */
    let usefulInputs = filterUselessInputs(body)

    //Distinguish between register and login from by the number of inputs
    //Then Distinguish between phased and not phased

    //Register screen
    //After certain condition is met, we can assume this is register page

    if (usefulInputs.length === 0) {
      await wait(400)

      usefulInputs = filterUselessInputs(body)
    }

    if (usefulInputs.length === 0) {
      const filledInputs = (await trpc.executeMainWorldAutofillFunction.mutate(
        secretsForHost.loginCredentials.map((cred) => ({
          username: cred.loginCredentials.username,
          password: cred.loginCredentials.password,
          lastUsedAt: cred.lastUsedAt ?? null
        }))
      )) as Array<{
        webInputType: WebInputType | null
        username: string | null
      }>

      const filled = filledInputs.find(
        (input) => input.webInputType === WebInputType.PASSWORD
      )
      if (filled) {
        notyf.success(`Autofilled password for ${filled.username}`)
      }
    }

    log('usefulInputs', usefulInputs)

    if (totpSecret && !inputTypesFilledForThisPage.has(WebInputType.TOTP)) {
      // generate first, so a segmented widget only matches at one box per digit
      const totpCode = safeGenerateTotpCode(totpSecret)
      if (totpCode && (await fillTotpCode(usefulInputs, totpCode))) {
        return
      }
    }

    /**
     * Everything below this point needs to know what kind of page we are on. A
     * change-password or signup form must never receive the stored password, and
     * a page we cannot confidently read gets the credential picker instead of a
     * silent fill.
     */
    const classification = classifyPageForAutofill(usefulInputs, body)
    const storedPasswordTarget =
      selectStoredPasswordAutofillTarget(classification)

    // arm this before any of the bail-outs below - even on a page we refuse to
    // autofill, the next form to appear may be a login form
    armInputAddedHandler()

    if (handleNewPasswordCase(classification)) {
      if (classification.kind === PasswordFormKind.CHANGE_PASSWORD) {
        offerCredentialPicker(classification)
      }
      return
    }

    if (classification.kind === PasswordFormKind.UNKNOWN) {
      log('page kind is unknown, offering the picker instead of autofilling')
      offerCredentialPicker(classification)
      return
    }

    // Fill known inputs
    let foundInputsCount = 0
    for (const webInputGql of webInputs) {
      const inputElList = body.querySelectorAll(
        webInputGql.domPath
      ) as NodeListOf<HTMLInputElement>

      const inputEl = inputElList[webInputGql.domOrdinal]

      //NOTE: We found element by DOM path
      if (inputEl) {
        // log('webInputGql was found')

        log(`autofilled by domPath ${webInputGql.domPath}`)
        if (
          webInputGql.kind === WebInputType.PASSWORD &&
          firstLoginCred &&
          inputEl.type === 'password' && // we don't want to autofill password to any other type of input
          // DOM paths are matched loosely by URL. Reuse the same production
          // policy as classifier-based fill so a learned path cannot authorize
          // a different password field.
          isStoredPasswordAutofillTarget(classification, inputEl)
        ) {
          foundInputsCount++
          const el = fillStringIntoInput({
            inputEl,
            loginCredential: firstLoginCred.loginCredentials,
            inputType: webInputGql.kind
          })

          el && filledElements.add(el)
        } else if (
          [
            WebInputType.EMAIL,
            WebInputType.USERNAME,
            WebInputType.USERNAME_OR_EMAIL
          ].includes(webInputGql.kind) &&
          firstLoginCred
        ) {
          foundInputsCount++
          const el = autofillValueIntoInput(
            inputEl,
            firstLoginCred.loginCredentials.username
          )
          el && filledElements.add(el)
        } else if (webInputGql.kind === WebInputType.TOTP) {
          if (!totpSecret) {
            log('no totp secret')
            return
          }
          foundInputsCount++
          const totpCode = safeGenerateTotpCode(totpSecret)
          if (!totpCode) {
            return
          }
          const el = autofillValueIntoInput(inputEl, totpCode)
          el && filledElements.add(el)
        }

        if (filledElements.size >= 2) {
          break
        }
        //NOTE: We did not find element by DOM path
      } else {
        // TODO we must let API know the element was not found. API will increase notFoundCount for this element and if it reaches a certain threshold, we should delete the element from the DB
      }
    }

    //NOTE: Guess web inputs, if we have credentials without DOM PATHS
    const mappedPasswordWasFilled =
      storedPasswordTarget !== null &&
      filledElements.has(storedPasswordTarget) &&
      storedPasswordTarget.value !== ''
    const shouldSearchForCredentialInputs =
      foundInputsCount === 0 ||
      (storedPasswordTarget !== null && !mappedPasswordWasFilled)

    if (
      shouldSearchForCredentialInputs &&
      secretsForHost.loginCredentials.length > 0
    ) {
      const autofillResult = await searchInputsAndAutofill(body, classification)
      if (autofillResult) {
        await trpc.saveCapturedInputEvents.mutate({
          inputEvents: domRecorder.toJSON(),
          url: document.documentURI
        })
      }
      log('autofillResult', autofillResult)
    }

    /**
     * Watches for inputs that show up after the initial scan - SPA route changes,
     * multi step logins, lazily rendered forms. Armed on every page, including the
     * ones we refuse to autofill, because the next form on the page may well be a
     * login form.
     */
    function armInputAddedHandler() {
      if (onInputAddedHandler) {
        bodyInputChangeEmitter.off('inputAdded', onInputAddedHandler)
      }

      //TODO: write a test for this
      // Catch new inputs
      onInputAddedHandler = debounce(
        async (inputEl) => {
          log('onInputAddedHandler received input', {
            id: inputEl?.id,
            type: inputEl?.type,
            ariaLabel: inputEl?.getAttribute?.('aria-label'),
            autocomplete: inputEl?.autocomplete
          })
          const looksLikeOtp = isLikelyOtpField(inputEl)
          const totpAlreadyFilled = inputTypesFilledForThisPage.has(
            WebInputType.TOTP
          )
          let dynamicTotpSecret = totpSecret
          if (looksLikeOtp && !dynamicTotpSecret) {
            try {
              const refreshedState =
                await trpc.getContentScriptInitialState.query()
              dynamicTotpSecret =
                refreshedState?.secretsForHost?.totpSecrets?.[0] ??
                dynamicTotpSecret
              log('refetched content script state for OTP', {
                totpSecretsCount:
                  refreshedState?.secretsForHost?.totpSecrets?.length ?? 0,
                hasTotpSecretAfterRefetch: Boolean(dynamicTotpSecret)
              })
            } catch (error) {
              log('failed to refetch content script state for OTP', error)
            }
          }

          if (looksLikeOtp) {
            log('segmented TOTP gate state', {
              hasTotpSecret: Boolean(dynamicTotpSecret),
              totpAlreadyFilled,
              filledElementsSize: filledElements.size
            })
          }
          if (dynamicTotpSecret && !totpAlreadyFilled) {
            log('checking for TOTP inputs on inputAdded')
            const totpCode = safeGenerateTotpCode(dynamicTotpSecret)
            if (
              totpCode &&
              (await fillTotpCode(filterUselessInputs(document.body), totpCode))
            ) {
              return
            }
          }

          for (const filledElement of filledElements) {
            if (
              filledElement.value === '' ||
              !isElementVisibleInViewport(filledElement)
            ) {
              filledElements.delete(filledElement)
            }
          }

          if (filledElements.size >= 2) {
            return // we have already filled 2 inputs on this page, we don't need to fill any more
          }
          log('onInputAddedHandler', inputEl)

          // The mutation observer batches all inputs through one trailing
          // debounce. The last event may be a checkbox or helper field even
          // though a password input was added in the same render, so always
          // rescan the live form instead of trusting only `inputEl`.
          const dynamicPasswordInput = filterUselessInputs(document.body).find(
            (element) => element.type === 'password'
          )
          if (dynamicPasswordInput) {
            const dynamicClassification =
              classifyPasswordForm(dynamicPasswordInput)
            if (handleNewPasswordCase(dynamicClassification)) {
              return
            }

            if (dynamicClassification.kind === PasswordFormKind.LOGIN) {
              await searchInputsAndAutofill(
                document.body,
                dynamicClassification
              )
              return
            }

            offerCredentialPicker(dynamicClassification)
            return
          }

          // For one input on page
          if (inputEl.type === 'username' || inputEl.type === 'email') {
            if (secretsForHost.loginCredentials.length === 1) {
              autofillValueIntoInput(
                inputEl,
                firstLoginCred.loginCredentials.username
              )
            } else {
              // todo show prompt to user to select which credential to use
            }
          }
        },
        500,
        {
          trailing: true,
          leading: false
        }
      )
    }

    if (!firstLoginCred && !totpSecret) {
      log('no secrets for host')
      return () => {}
    }

    if (filledElements.size === 2) {
      const filledElementsArray = Array.from(filledElements)
      const form = filledElementsArray[0]?.form
      const areFilledElementsVisible = filledElementsArray.every((inputEl) =>
        isElementVisibleInViewport(inputEl)
      )

      const mayAutoSubmit =
        classification.kind === PasswordFormKind.LOGIN &&
        classification.confidence === 'high'

      if (
        mayAutoSubmit &&
        form &&
        isElementVisibleInViewport(form) &&
        areFilledElementsVisible
      ) {
        const clickEvent = new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        })
        const submitButton = form.querySelector(
          '[type="submit"]'
        ) as HTMLElement | null
        if (submitButton) {
          submitButton.dispatchEvent(clickEvent)
        }

        let notAPasswordInput: HTMLInputElement | null = null

        for (const el of filledElements) {
          if (el?.type !== 'password') {
            notAPasswordInput = el
            break
          }
        }

        if (notAPasswordInput) {
          notyf.success(
            `Submitted autofilled form for user "${notAPasswordInput.value}"`
          )
        }
      } else {
        log(
          'skipping submit for autofilled form',
          mayAutoSubmit
            ? 'because form or filled inputs are not visible in viewport'
            : `because page kind is ${classification.kind} (${classification.confidence} confidence)`
        )
      }
    }

    async function searchInputsAndAutofill(
      documentBody: HTMLElement,
      formClassification: PasswordFormClassification
    ) {
      const newWebInputs: WebInputsArrayClientSide = []
      const storedPasswordTarget =
        selectStoredPasswordAutofillTarget(formClassification)
      // only look inside the credential form - a flat scan of the whole document
      // is how a site-wide search box ends up being treated as the username field
      const inputElsArray = (
        filterUselessInputs(documentBody) as HTMLInputElement[]
      ).filter((el) => formClassification.scope.contains(el))
      log('inputElsArray', inputElsArray)

      if (inputElsArray.length === 1) {
        if (inputElsArray[0] === storedPasswordTarget) {
          // this branch handles multi step google login pages specifically. We might add more cases in the future
          const visibleText = getAllVisibleTextOnDocumentBody()

          let matchingLogin =
            secretsForHost.loginCredentials.length === 1
              ? secretsForHost.loginCredentials[0]
              : secretsForHost.loginCredentials.find((login) => {
                  return visibleText.includes(login.loginCredentials.username)
                })
          if (!matchingLogin) {
            // some pages obscure the email visible on the page, for example  https://accounts.binance.com/en/login-password
            // for these we should autofill the login based on the last inputted username

            const storedVal = await browser.storage.local.get(
              'lastAutofilledValue'
            )

            matchingLogin = secretsForHost.loginCredentials.find((login) => {
              return (
                login.loginCredentials.username ===
                storedVal.lastAutofilledValue
              )
            })
          }

          if (matchingLogin) {
            const autofilledElPassword = fillStringIntoInput({
              inputEl: inputElsArray[0],
              loginCredential: matchingLogin.loginCredentials,
              inputType: WebInputType.PASSWORD
            })

            // TODO we should show a notification to let user know which login was used for autofill to prevent confusion when multiple logins are available and maybe some of them are wrong
            return autofilledElPassword
          }
        }
      } else {
        for (let index = 0; index < inputElsArray.length; index++) {
          const input = inputElsArray[index]
          if (input.type === 'password') {
            if (input !== storedPasswordTarget) {
              continue
            }

            //Save password input, if we have more credentials with no DOM PATH
            if (
              webInputs.length === 0 &&
              secretsForHost.loginCredentials.length > 1
            ) {
              const selector = getSelectorForElement(input)
              newWebInputs.push({
                createdAt: new Date().toString(),
                domPath: selector.css,
                domOrdinal: selector.domOrdinal,
                host: location.host,
                url: location.href,
                kind: WebInputType.PASSWORD
              })

              domRecorder.addInputEvent({
                element: input,
                eventType: 'input',
                kind: WebInputType.PASSWORD,
                inputted: input.value
              })
            }

            // the classifier already picked the username field out of the form,
            // which avoids grabbing whatever input happens to precede the password
            const usernameInputEl = formClassification.usernameInput
            if (usernameInputEl) {
              log('found username input', usernameInputEl)

              //Save username input, if we have more credentials with no DOM PATH then let user choose which psw to use
              if (
                webInputs.length === 0 &&
                secretsForHost.loginCredentials.length > 1
              ) {
                const selector = getSelectorForElement(usernameInputEl)
                newWebInputs.push({
                  createdAt: new Date().toString(),
                  domPath: selector.css,
                  domOrdinal: selector.domOrdinal,
                  host: location.host,
                  url: location.href,
                  kind: WebInputType.USERNAME
                })

                domRecorder.addInputEvent({
                  element: usernameInputEl,
                  eventType: 'input',
                  kind: WebInputType.USERNAME_OR_EMAIL,
                  inputted: usernameInputEl.value
                })
              } else {
                const recentlyUsedLogin = secretsForHost.loginCredentials.sort(
                  (a, b) => {
                    return (a.lastUsedAt ?? '') > (b.lastUsedAt ?? '') ? -1 : 1
                  }
                )[0]

                const autofilledElUsername = autofillValueIntoInput(
                  usernameInputEl,
                  recentlyUsedLogin.loginCredentials.username
                )

                domRecorder.addInputEvent({
                  element: usernameInputEl,
                  eventType: 'input',
                  inputted: recentlyUsedLogin.loginCredentials.username,
                  kind: WebInputType.USERNAME
                })

                const autofilledElPassword = autofillValueIntoInput(
                  input,
                  recentlyUsedLogin.loginCredentials.password
                )

                domRecorder.addInputEvent({
                  element: input,
                  eventType: 'input',
                  inputted: recentlyUsedLogin.loginCredentials.password,
                  kind: WebInputType.PASSWORD
                })

                return !!autofilledElUsername || !!autofilledElPassword
              }
            }

            //Let user choose which credential to use
            if (secretsForHost.loginCredentials.length > 1) {
              log('choose credential', domRecorder.toJSON())
              renderLoginCredOption({
                loginCredentials: secretsForHost.loginCredentials,
                webInputs: newWebInputs
              })

              return true
            }

            return false
          }
        }
      }

      // we have not found any password inputs, let's try to find a username input as this could be a multi step login page where the password is entered later

      for (let index = 0; index < inputElsArray.length; index++) {
        const input = inputElsArray[index]

        if (
          input.autocomplete?.includes('username') ||
          input.autocomplete?.includes('email')
        ) {
          const recentlyUsedLogin = secretsForHost.loginCredentials.sort(
            (a, b) => {
              return (a.lastUsedAt ?? '') > (b.lastUsedAt ?? '') ? -1 : 1
            }
          )[0]

          const autofilledElUsername = autofillValueIntoInput(
            input,
            recentlyUsedLogin.loginCredentials.username
          )

          return !!autofilledElUsername
        }
      }
      return false
    }
  }

  const onInputAddedRelay = (inputEl: HTMLInputElement) => {
    onInputAddedHandler(inputEl)
  }

  const initAutofill = () => {
    scanKnownWebInputsAndFillWhenFound()

    //If input shows on loaded page

    bodyInputChangeEmitter.on('inputAdded', onInputAddedRelay)
  }
  const initTimeout = setTimeout(initAutofill, 150) // let's wait a bit for the page to load

  return () => {
    bodyInputChangeEmitter.off('inputAdded', onInputAddedRelay)
    clearTimeout(initTimeout)
    inputTypesFilledForThisPage.clear()
  }
}

export const debouncedAutofill = debounce(autofill, 300, {
  trailing: true,
  leading: false
})

export function generatePasswordBasedOnUserConfig() {
  const config = {
    // TODO get config from device.state
    length: 12,
    numbers: true,
    uppercase: true,
    symbols: true,
    strict: true
  }
  return generate(config)
}
