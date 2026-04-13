import { bodyInputChangeEmitter } from './domMutationObserver'
import { generateSync } from 'otplib'
import debug from 'debug'
import { generate } from 'generate-password'
import { isElementVisibleInViewport } from './isElementInViewport'
import { domRecorder, IInitStateRes } from './contentScript'
import { WebInputType } from '../../../shared/generated/graphqlBaseTypes'
import { authierColors } from '../../../shared/chakraRawTheme'
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
import { filterUselessInputs } from './getAllInputsIncludingShadowDom'
import {
  appendGeneratedPasswordHistoryEntry,
  createGeneratedPasswordHistoryEntry
} from '@src/util/generatedPasswordHistory'

const log = debug('au:autofill')

export type IDecryptedSecrets = {
  loginCredentials: ILoginSecret[]
  totpSecrets: ITOTPSecret[]
}

export const autofillEventsDispatched = new Set()

function safeGenerateTotpCode(totpSecret: ITOTPSecret) {
  try {
    return generateSync({ secret: totpSecret.totp.secret })
  } catch (error) {
    log('failed to generate totp code', error)
    return null
  }
}

function findSegmentedTotpInputs(usefulInputs: HTMLInputElement[]) {
  const codeInputRegex = /code input\s*(\d+)\s*of\s*(\d+)/i

  const labeledCandidates = usefulInputs
    .map((inputEl) => {
      const ariaLabel = inputEl.getAttribute('aria-label') ?? ''
      const match = ariaLabel.match(codeInputRegex)
      if (!match) {
        return null
      }

      const index = Number(match[1])
      const total = Number(match[2])

      if (
        !Number.isFinite(index) ||
        !Number.isFinite(total) ||
        total !== 6 ||
        inputEl.type !== 'number'
      ) {
        return null
      }

      return { inputEl, index, total }
    })
    .filter(Boolean) as Array<{
    inputEl: HTMLInputElement
    index: number
    total: number
  }>

  if (labeledCandidates.length > 0) {
    log(
      'segmented TOTP candidates found',
      labeledCandidates.map(({ inputEl, index, total }) => ({
        id: inputEl.id,
        type: inputEl.type,
        ariaLabel: inputEl.getAttribute('aria-label'),
        index,
        total
      }))
    )
  }

  if (labeledCandidates.length >= 6) {
    const byIndex = new Map<number, HTMLInputElement>()
    for (const candidate of labeledCandidates) {
      if (!byIndex.has(candidate.index)) {
        byIndex.set(candidate.index, candidate.inputEl)
      }
    }

    const ordered = [1, 2, 3, 4, 5, 6]
      .map((index) => byIndex.get(index))
      .filter(Boolean) as HTMLInputElement[]

    if (ordered.length === 6) {
      log(
        'segmented TOTP inputs detected',
        ordered.map((input) => ({
          id: input.id,
          ariaLabel: input.getAttribute('aria-label')
        }))
      )
      return ordered
    }
  }

  if (usefulInputs.length > 0) {
    const numericInputs = usefulInputs.filter(
      (input) => input.type === 'number'
    )
    if (numericInputs.length >= 4) {
      log(
        'segmented TOTP detection miss',
        numericInputs.map((input) => ({
          id: input.id,
          type: input.type,
          ariaLabel: input.getAttribute('aria-label'),
          inputMode: input.inputMode,
          pattern: input.getAttribute('pattern'),
          value: input.value
        }))
      )
    }
  }

  return null
}

function fillSegmentedTotpInputs(inputs: HTMLInputElement[], totpCode: string) {
  if (inputs.length !== 6 || totpCode.length < 6) {
    return false
  }

  const digits = totpCode.slice(0, 6).split('')
  let filledAny = false

  for (let index = 0; index < inputs.length; index++) {
    const el = autofillValueIntoInput(inputs[index], digits[index])
    if (el) {
      filledElements.add(el)
      filledAny = true
    }
  }

  if (filledAny) {
    inputTypesFilledForThisPage.add(WebInputType.TOTP)
    notyf.success('Autofilled 2FA code')
  }

  return filledAny
}

/**
 * triggered when page contains 2 or more useful inputs
 * @param usefulInputs
 */
export async function handleGeneratedPasswordAutofill(
  password: string,
  options: { showSavePrompt: boolean }
) {
  await appendGeneratedPasswordHistoryEntry(
    createGeneratedPasswordHistoryEntry({
      pageUrl: window.location.href,
      password
    })
  )

  if (options.showSavePrompt) {
    await renderSaveCredentialsForm(null, password)
  }
}

async function handleNewPasswordCase(usefulInputs: HTMLInputElement[]) {
  // TODO only do this after user confirmation as this could cause user to change their password by mistake-for example when they edit something on their profile and it also has the two password inputs
  for (let index = 0; index < usefulInputs.length - 1; index++) {
    const input = usefulInputs[index]
    if (
      input.type === 'password' &&
      usefulInputs[index + 1].type === 'password'
    ) {
      const newPassword = generatePasswordBasedOnUserConfig()
      autofillValueIntoInput(usefulInputs[index], newPassword)
      autofillValueIntoInput(usefulInputs[index + 1], newPassword)

      await handleGeneratedPasswordAutofill(newPassword, {
        showSavePrompt: true
      })
      return true
    } else if (input.getAttribute('autocomplete')?.includes('new-password')) {
      // TODO it would make sense to render the password generator here, but renderPasswordGenerator is not implemented yet
      // renderPasswordGenerator({ input: input })
      // const password = generate({
      //   length: 10,
      //   numbers: true,
      //   uppercase: true,
      //   symbols: true,
      //   strict: true
      // })
      // autofillValueIntoInput(input, password)

      return true
    }
  }
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

      const change = new Event('change', { bubbles: true })

      dispatchAutofillEvent(change)
      dispatchTextInputEvent(el, key)
      // await sleep(2) // this is to make it a bit more realistic
    }

    const blurEvent = new Event('blur', { bubbles: true }) // this is needed, because some websites actually trigger form validation on blur. for example coinmate.io
    dispatchAutofillEvent(blurEvent)
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
    return null
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

  element.style.backgroundColor = authierColors.green[400]
  browser.storage.local.set({
    // used for multi-step password autofill later
    lastAutofilledValue: value
  })
  imitateKeyInput(element, value)
  filledElements.add(element)

  return element
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
    log(`inputType ${inputType} already filled for this page`)
    return
  }

  inputTypesFilledForThisPage.add(inputType)

  const el = autofillValueIntoInput(inputEl, loginCredential.password)

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
      const segmentedTotpInputs = findSegmentedTotpInputs(usefulInputs)
      if (segmentedTotpInputs) {
        const totpCode = safeGenerateTotpCode(totpSecret)
        if (totpCode) {
          const didFillSegmentedTotp = fillSegmentedTotpInputs(
            segmentedTotpInputs,
            totpCode
          )
          if (didFillSegmentedTotp) {
            return
          }
        }
      }
    }

    if (usefulInputs.length >= 2) {
      const isNewPassword = await handleNewPasswordCase(usefulInputs)
      if (isNewPassword) {
        return
      }
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

        foundInputsCount++
        log(`autofilled by domPath ${webInputGql.domPath}`)
        if (
          webInputGql.kind === WebInputType.PASSWORD &&
          firstLoginCred &&
          inputEl.type === 'password' // we don't want to autofill password to any other type of input
        ) {
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
    if (
      foundInputsCount === 0 &&
      secretsForHost.loginCredentials.length > 0
      // filledElements.length === 0
    ) {
      const autofillResult = await searchInputsAndAutofill(body)
      if (autofillResult) {
        await trpc.saveCapturedInputEvents.mutate({
          inputEvents: domRecorder.toJSON(),
          url: document.documentURI
        })
      }
      log('autofillResult', autofillResult)
    }

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
        const isLikelyOtpField =
          inputEl?.type === 'number' ||
          (inputEl?.getAttribute?.('aria-label') ?? '')
            .toLowerCase()
            .includes('code input')
        const totpAlreadyFilled = inputTypesFilledForThisPage.has(
          WebInputType.TOTP
        )
        let dynamicTotpSecret = totpSecret
        if (isLikelyOtpField && !dynamicTotpSecret) {
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

        if (isLikelyOtpField) {
          log('segmented TOTP gate state', {
            hasTotpSecret: Boolean(dynamicTotpSecret),
            totpAlreadyFilled,
            filledElementsSize: filledElements.size
          })
        }
        if (dynamicTotpSecret && !totpAlreadyFilled) {
          log('checking for segmented TOTP inputs on inputAdded')
          const segmentedTotpInputs = findSegmentedTotpInputs(
            filterUselessInputs(document.body)
          )
          if (segmentedTotpInputs) {
            const totpCode = safeGenerateTotpCode(dynamicTotpSecret)
            if (totpCode) {
              const didFillSegmentedTotp = fillSegmentedTotpInputs(
                segmentedTotpInputs,
                totpCode
              )
              if (didFillSegmentedTotp) {
                return
              }
            }
          }
        }

        if (filledElements.size >= 2) {
          return // we have already filled 2 inputs on this page, we don't need to fill any more
        }
        log('onInputAddedHandler', inputEl)
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
        } else if (inputEl.autocomplete?.includes('new-password')) {
          const newPassword = generatePasswordBasedOnUserConfig()
          autofillValueIntoInput(inputEl, newPassword)
          await handleGeneratedPasswordAutofill(newPassword, {
            showSavePrompt: false
          })
        } else {
          // More inputs on page
          if (inputEl.type === 'password') {
            const passwordInputsOnPage = document.querySelectorAll(
              'input[type="password"]'
            ) as NodeListOf<HTMLInputElement>

            if (passwordInputsOnPage.length === 2) {
              if (
                passwordInputsOnPage[0].autocomplete?.includes(
                  'current-password'
                ) === false &&
                passwordInputsOnPage[1].autocomplete?.includes(
                  'current-password'
                ) === false
              ) {
                const newPassword = generatePasswordBasedOnUserConfig()

                // must be some kind of signup page
                autofillValueIntoInput(passwordInputsOnPage[0], newPassword)

                autofillValueIntoInput(passwordInputsOnPage[1], newPassword)
                await handleGeneratedPasswordAutofill(newPassword, {
                  showSavePrompt: true
                })
              }
            }
          }
        }
      },
      500,
      {
        trailing: true,
        leading: false
      }
    )

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

      if (form && isElementVisibleInViewport(form) && areFilledElementsVisible) {
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
          'skipping submit for autofilled form because form or filled inputs are not visible in viewport'
        )
      }
    }

    async function searchInputsAndAutofill(documentBody: HTMLElement) {
      const newWebInputs: WebInputsArrayClientSide = []
      const inputElsArray = filterUselessInputs(documentBody)
      log('inputElsArray', inputElsArray)

      if (inputElsArray.length === 1) {
        if (inputElsArray[0].type === 'password') {
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

            //Search for a username input by going backwards in the array from the password input
            for (let j = index - 1; j >= 0; j--) {
              if (inputElsArray[j].type !== 'hidden') {
                log('found username input', inputElsArray[j])

                //Save username input, if we have more credentials with no DOM PATH then break from loop and let user choose which psw to use
                if (
                  webInputs.length === 0 &&
                  secretsForHost.loginCredentials.length > 1
                ) {
                  const selector = getSelectorForElement(inputElsArray[j])
                  newWebInputs.push({
                    createdAt: new Date().toString(),
                    domPath: selector.css,
                    domOrdinal: selector.domOrdinal,
                    host: location.host,
                    url: location.href,
                    kind: WebInputType.USERNAME
                  })

                  domRecorder.addInputEvent({
                    element: inputElsArray[j],
                    eventType: 'input',
                    kind: WebInputType.USERNAME_OR_EMAIL,
                    inputted: inputElsArray[j].value
                  })
                  break
                }
                const recentlyUsedLogin = secretsForHost.loginCredentials.sort(
                  (a, b) => {
                    return (a.lastUsedAt ?? '') > (b.lastUsedAt ?? '') ? -1 : 1
                  }
                )[0]

                const autofilledElUsername = autofillValueIntoInput(
                  inputElsArray[j],
                  recentlyUsedLogin.loginCredentials.username
                )

                domRecorder.addInputEvent({
                  element: inputElsArray[j],
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

function generatePasswordBasedOnUserConfig() {
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
