import { apolloClient } from '@src/apollo/apolloClient'
import { IInitStateRes } from '@src/content-script/contentScript'
import {
  EncryptedSecretType,
  WebInputGql,
  WebInputGqlScalars
} from '../../../shared/generated/graphqlBaseTypes'
import { saveLoginModalsStates } from './chromeRuntimeListener'
import {
  WebInputsForHostDocument,
  WebInputsForHostQuery,
  WebInputsForHostQueryVariables
} from './chromeRuntimeListener.codegen'
import { SecretTypeUnion, device } from './ExtensionDevice'
import mem from 'mem'
import ms from 'ms'
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'

import debug from 'debug'
import { constructURL } from '@shared/urlUtils'
const log = debug('au:getContentScriptInitialState')

export const getContentScriptInitialState = async (
  tabUrl: string,
  currentTabId: number
): Promise<IInitStateRes> => {
  log('tabUrl', tabUrl)
  const hostname = constructURL(tabUrl).hostname

  let decrypted: SecretTypeUnion[]
  if (hostname) {
    if (device.state) {
      decrypted = await device.state.getSecretsDecryptedByHostname(hostname)
    } else {
      decrypted = []
    }
  } else {
    decrypted = []
  }

  let webInputs: WebInputGqlScalars[] = []

  if (hostname) {
    try {
      const webInputsResponse = await getWebInputs(hostname) // TODO move web inputs into device init. We will make a single call to get all the web inputs for all the hosts that appear in users secrets
      webInputs = webInputsResponse?.data.webInputs ?? []
    } catch (err) {
      log('webInputs error', err)
      // we don't want to throw here, because it would break autofill in content script which does not even need webInputs in many cases
    }
  }
  return {
    extensionDeviceReady: !!device.state?.masterEncryptionKey,
    //TODO: Add autofill for TOTP
    autofillEnabled: !!device.state?.autofillCredentialsEnabled,
    webInputs: webInputs,
    passwordCount:
      device.state?.secrets.filter(
        (i) => i.kind === EncryptedSecretType.LOGIN_CREDENTIALS
      ).length ?? 0,
    secretsForHost: {
      loginCredentials: decrypted.filter(
        ({ kind }) => kind === EncryptedSecretType.LOGIN_CREDENTIALS
      ) as ILoginSecret[],
      totpSecrets: decrypted.filter(
        ({ kind }) => kind === EncryptedSecretType.TOTP
      ) as ITOTPSecret[]
    },
    saveLoginModalsState: currentTabId
      ? saveLoginModalsStates.get(currentTabId)
      : null
  }
}

// TODO stop using mem for this, we should be able to use the apollo cache
const getWebInputs = mem(
  (hostname: string) => {
    return apolloClient.query<
      WebInputsForHostQuery,
      WebInputsForHostQueryVariables
    >({
      query: WebInputsForHostDocument,
      variables: { host: hostname },
      errorPolicy: 'ignore'
    })
  },
  { maxAge: ms('2 days') }
)
