import { IInitStateRes } from '@src/content-script/contentScript'
import { EncryptedSecretType } from '../../../shared/generated/graphqlBaseTypes'
import { saveLoginModalsStates } from './autofillPageState'
import { SecretTypeUnion, device } from './ExtensionDevice'
import { ILoginSecret, ITOTPSecret } from '@src/util/useDeviceState'

import debug from 'debug'
import { constructURL } from '@shared/urlUtils'
import { isAutofillForbiddenForUrl } from '@shared/autofillForbiddenUrlPatterns'
import { getWebInputsForUrl } from './getWebInputsForUrl'
import { isAutofillPausedForPage } from './autofillPagePause'
import { getAutofillCredentialsEnabled } from '@src/util/autofillCredentialsPreference'
import { isSecureContextUrl } from './autofillSender'
const log = debug('au:getContentScriptInitialState')

const byMostRecentUse = (a: SecretTypeUnion, b: SecretTypeUnion) =>
  new Date(b.lastUsedAt ?? b.createdAt).getTime() -
  new Date(a.lastUsedAt ?? a.createdAt).getTime()

export const getContentScriptInitialState = async (
  tabUrl: string,
  currentTabId: number,
  documentKey = `${currentTabId}:0`
): Promise<IInitStateRes> => {
  if (!(await device.ensureUnlocked())) return emptyContentScriptState()
  const session = device.state
  const hostname = constructURL(tabUrl).hostname

  let decrypted: SecretTypeUnion[]
  // Every saved secret counts as https. A plain-http page, which anyone on the
  // network can serve, gets none; http on this machine (localhost) is exempt.
  if (hostname && isSecureContextUrl(tabUrl)) {
    if (session) {
      decrypted = await session.getSecretsDecryptedByTLD(hostname)

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
        session.secrets.some(
          (secret) => secret.kind === EncryptedSecretType.TOTP
        )
      ) {
        const refreshed = await session.getAllSecretsDecrypted()
        if (device.state !== session) return emptyContentScriptState()
        session.decryptedSecrets = refreshed
        decrypted = await session.getSecretsDecryptedByTLD(hostname)

        log('host-matched secrets after cache refresh', {
          hostname,
          loginCount: decrypted.filter(
            ({ kind }) => kind === EncryptedSecretType.LOGIN_CREDENTIALS
          ).length,
          totpCount: decrypted.filter(
            ({ kind }) => kind === EncryptedSecretType.TOTP
          ).length
        })
      }
    } else {
      decrypted = []
    }
  } else {
    decrypted = []
  }

  const webInputs = getWebInputsForUrl(tabUrl)
  const [isPausedForPage, autofillCredentialsEnabled] = await Promise.all([
    isAutofillPausedForPage(currentTabId, tabUrl),
    getAutofillCredentialsEnabled()
  ])

  const loginCredentialsForHost = decrypted
    .filter(
      (secret): secret is ILoginSecret =>
        secret.kind === EncryptedSecretType.LOGIN_CREDENTIALS
    )
    .sort(byMostRecentUse)

  let totpSecretsForHost = decrypted.filter(
    (secret): secret is ITOTPSecret => secret.kind === EncryptedSecretType.TOTP
  )

  if (
    totpSecretsForHost.length === 0 &&
    loginCredentialsForHost.length > 0 &&
    session
  ) {
    const urlLessTotpCandidates = session.decryptedSecrets
      .filter(
        (secret): secret is ITOTPSecret =>
          secret.kind === EncryptedSecretType.TOTP && !secret.totp?.url
      )
      .sort(byMostRecentUse)

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

  // Never return plaintext produced by a session that locked while we awaited
  // decryption or browser storage. A newly unlocked session is a different object.
  if (!(await device.ensureUnlocked()) || device.state !== session)
    return emptyContentScriptState()
  if (
    !autofillCredentialsEnabled ||
    isPausedForPage ||
    isAutofillForbiddenForUrl(
      tabUrl,
      session?.autofillForbiddenUrlPatterns ?? ''
    )
  )
    return { ...emptyContentScriptState(), extensionDeviceReady: true }

  return {
    extensionDeviceReady: !!session?.masterEncryptionKey,
    //TODO: Add autofill for TOTP
    autofillEnabled:
      autofillCredentialsEnabled &&
      !isPausedForPage &&
      !isAutofillForbiddenForUrl(
        tabUrl,
        session?.autofillForbiddenUrlPatterns ?? ''
      ),
    webInputs: webInputs,
    passwordCount:
      session?.secrets.filter(
        (i) => i.kind === EncryptedSecretType.LOGIN_CREDENTIALS
      ).length ?? 0,
    secretsForHost: {
      loginCredentials: loginCredentialsForHost,
      totpSecrets: totpSecretsForHost
    },
    saveLoginModalsState: currentTabId
      ? saveLoginModalsStates.get(documentKey)
      : null
  }
}

function emptyContentScriptState(): IInitStateRes {
  return {
    extensionDeviceReady: false,
    autofillEnabled: false,
    passwordCount: 0,
    webInputs: [],
    secretsForHost: { loginCredentials: [], totpSecrets: [] },
    saveLoginModalsState: null
  }
}
