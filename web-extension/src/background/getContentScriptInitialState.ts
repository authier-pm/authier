import { apolloClient } from '@src/apollo/apolloClient'
import { IInitStateRes } from '@src/content-script/contentScript'
import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'
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

  const res = hostname ? await getWebInputs(hostname) : null
  return {
    extensionDeviceReady: !!device.state?.masterEncryptionKey,
    //TODO: Add autofill for TOTP
    autofillEnabled: !!device.state?.autofillCredentialsEnabled,
    webInputs: res?.data.webInputs ?? [],
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
      fetchPolicy: 'network-only'
    })
  },
  { maxAge: ms('2 days') }
)
