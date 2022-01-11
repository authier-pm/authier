import { apolloClient } from '@src/apollo/apolloClient'
import { IInitStateRes } from '@src/content-script/contentScript'
import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'
import { saveLoginModalsStates } from './chromeRuntimeListener'
import {
  WebInputsForHostDocument,
  WebInputsForHostQuery,
  WebInputsForHostQueryVariables
} from './chromeRuntimeListener.codegen'
import { device } from './ExtensionDevice'
import mem from 'mem'
import ms from 'ms'

export const getContentScriptInitialState = async (
  tabUrl: string,
  currentTabId: number
): Promise<IInitStateRes> => {
  const hostname = new URL(tabUrl).hostname
  const decrypted = device.state?.getSecretsDecryptedByHostname(hostname ?? [])

  const res = await getWebInputs(hostname)

  return {
    extensionDeviceReady: !!device.state?.masterPassword,
    webInputs: res.data.webInputs,
    secretsForHost: {
      // @ts-expect-error
      loginCredentials: decrypted.filter(
        ({ kind }) => kind === EncryptedSecretType.LOGIN_CREDENTIALS
      ),
      // @ts-expect-error
      totpSecrets: decrypted.filter(
        ({ kind }) => kind === EncryptedSecretType.TOTP
      )
    },
    saveLoginModalsState: currentTabId
      ? saveLoginModalsStates.get(currentTabId)
      : null
  }
}

const getWebInputs = mem(
  (hostname: string) => {
    return apolloClient.query<
      WebInputsForHostQuery,
      WebInputsForHostQueryVariables
    >({ query: WebInputsForHostDocument, variables: { host: hostname } })
  },
  { maxAge: ms('2 days') }
)
