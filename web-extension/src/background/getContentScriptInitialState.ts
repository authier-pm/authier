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

      const initialLoginCount = decrypted.filter(
        ({ kind }) => kind === EncryptedSecretType.LOGIN_CREDENTIALS
      ).length
      const initialTotpCount = decrypted.filter(
        ({ kind }) => kind === EncryptedSecretType.TOTP
      ).length

      log('initial host-matched secrets', {
        hostname,
        initialLoginCount,
        initialTotpCount
      })

      // Service worker/background cache can lag behind local state updates.
      // Retry once with a refreshed decrypted cache if TOTP is unexpectedly missing.
      if (
        initialTotpCount === 0 &&
        device.state.secrets.some((secret) => secret.kind === EncryptedSecretType.TOTP)
      ) {
        device.state.decryptedSecrets = await device.state.getAllSecretsDecrypted()
        decrypted = await device.state.getSecretsDecryptedByTLD(hostname)

        log('host-matched secrets after cache refresh', {
          hostname,
          loginCount: decrypted.filter(
            ({ kind }) => kind === EncryptedSecretType.LOGIN_CREDENTIALS
          ).length,
          totpCount: decrypted.filter(({ kind }) => kind === EncryptedSecretType.TOTP)
            .length
        })
      }
    } else {
      decrypted = []
    }
  } else {
    decrypted = []
  }

  let webInputs = getWebInputsForUrl(tabUrl)

  const loginCredentialsForHost = decrypted
    .filter(({ kind }) => kind === EncryptedSecretType.LOGIN_CREDENTIALS)
    .sort((a, b) => {
      return (
        new Date(b.lastUsedAt ?? b.createdAt).getTime() -
        new Date(a.lastUsedAt ?? a.createdAt).getTime()
      )
    }) as ILoginSecret[]

  let totpSecretsForHost = decrypted.filter(
    ({ kind }) => kind === EncryptedSecretType.TOTP
  ) as ITOTPSecret[]

  if (
    totpSecretsForHost.length === 0 &&
    loginCredentialsForHost.length > 0 &&
    device.state
  ) {
    const urlLessTotpCandidates = (
      device.state.decryptedSecrets.filter(
        (secret) =>
          secret.kind === EncryptedSecretType.TOTP && !secret.totp?.url
      ) as ITOTPSecret[]
    ).sort((a, b) => {
      return (
        new Date(b.lastUsedAt ?? b.createdAt).getTime() -
        new Date(a.lastUsedAt ?? a.createdAt).getTime()
      )
    })

    if (urlLessTotpCandidates.length === 1) {
      totpSecretsForHost = [urlLessTotpCandidates[0]]
      log('using URL-less TOTP fallback for content script', {
        hostname,
        totpId: urlLessTotpCandidates[0].id,
        label: urlLessTotpCandidates[0].totp.label
      })
    } else if (urlLessTotpCandidates.length > 1) {
      log('skipping URL-less TOTP fallback due to ambiguity', {
        hostname,
        candidateCount: urlLessTotpCandidates.length
      })
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
      loginCredentials: loginCredentialsForHost,
      totpSecrets: totpSecretsForHost
    },
    saveLoginModalsState: currentTabId
      ? saveLoginModalsStates.get(currentTabId)
      : null
  }
}
