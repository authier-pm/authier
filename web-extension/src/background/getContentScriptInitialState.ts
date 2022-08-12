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
import { ILoginSecret, ISecret, ITOTPSecret } from '@src/util/useDeviceState'

export const getContentScriptInitialState = async (
  tabUrl: string,
  currentTabId: number
): Promise<IInitStateRes> => {
  console.log({ tabUrl })
  const hostname = new URL(tabUrl).hostname
  console.log('~ getContentScriptInitialState')
  const decrypted =
    device.state?.getSecretsDecryptedByHostname(hostname) ?? ([] as ISecret[])

  const res = await getWebInputs(hostname)
  console.log('getWebInputs', res.data.webInputs, hostname)
  return {
    extensionDeviceReady: !!device.state?.masterEncryptionKey,
    autofillEnabled: !!device.state?.autofill,
    webInputs: res.data.webInputs,
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
