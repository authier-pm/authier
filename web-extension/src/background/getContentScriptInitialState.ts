import { IInitStateRes } from '@src/content-script/contentScript'
import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'
import { saveLoginModalsStates } from './chromeRuntimeListener'
import { SecretTypeUnion, device } from './ExtensionDevice'
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'

import debug from 'debug'
import { constructURL } from '@shared/urlUtils'
import { getWebInputsForUrl } from './getWebInputsForUrl'
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
      decrypted = await device.state.getSecretsDecryptedByTLD(hostname)
    } else {
      decrypted = []
    }
  } else {
    decrypted = []
  }

  let webInputs = getWebInputsForUrl(tabUrl)

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
      loginCredentials: decrypted
        .filter(({ kind }) => kind === EncryptedSecretType.LOGIN_CREDENTIALS)
        .sort((a, b) => {
          return (
            new Date(b.lastUsedAt ?? b.createdAt).getTime() -
            new Date(a.lastUsedAt ?? a.createdAt).getTime()
          )
        }) as ILoginSecret[],
      totpSecrets: decrypted.filter(
        ({ kind }) => kind === EncryptedSecretType.TOTP
      ) as ITOTPSecret[]
    },
    saveLoginModalsState: currentTabId
      ? saveLoginModalsStates.get(currentTabId)
      : null
  }
}
