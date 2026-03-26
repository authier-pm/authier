import { useContext, useEffect, useState } from 'react'
import { formatRelative } from 'date-fns'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import debug from 'debug'
import browser from 'webextension-polyfill'
import { IoWarningOutline } from 'react-icons/io5'
import { device } from '@src/background/ExtensionDevice'
import { useThemeMode } from '@src/ExtensionProviders'
import { Txt } from '@src/components/util/Txt'
import { Button } from '@src/components/ui/button'
import { UserContext } from '@src/providers/UserProvider'
import { LoginContext } from './Login'
import {
  useAddNewDeviceForUserMutation,
  useDeviceDecryptionChallengeMutation,
  useInitiateMasterDeviceResetMutation
} from '@shared/graphql/Login.codegen'
import { getUserFromToken, setAccessToken } from '../util/accessTokenExtension'
import { IBackgroundStateSerializable } from '@src/background/backgroundPage'
import {
  base64ToBuffer,
  cryptoKeyToString,
  dec,
  generateEncryptionKey
} from '@util/generateEncryptionKey'
import { toast } from '@src/ExtensionProviders'

export const LOGIN_DECRYPTION_CHALLENGE_REFETCH_INTERVAL = 6000
export const log = debug('au:LoginAwaitingApproval')

export const useLogin = (props: { deviceName: string }) => {
  const { formStateContext, setFormStateContext } = useContext(LoginContext)
  const { colorMode, toggleColorMode } = useThemeMode()
  const { setUserId } = useContext(UserContext)
  const [addNewDevice, { loading, error }] = useAddNewDeviceForUserMutation()
  const deviceDecryptionChallengeVariables = {
    deviceInput: {
      id: device.id as string,
      name: props.deviceName,
      platform: device.platform
    },
    email: formStateContext.email
  }
  const [
    getDeviceDecryptionChallenge,
    { data: decryptionData, error: decryptionChallengeError }
  ] = useDeviceDecryptionChallengeMutation({
    variables: deviceDecryptionChallengeVariables
  })

  useEffect(() => {
    if (error || decryptionChallengeError) {
      setFormStateContext({
        ...formStateContext,
        isSubmitted: false
      })
    }
  }, [decryptionChallengeError, error, formStateContext, setFormStateContext])

  useEffect(() => {
    const interval = window.setInterval(() => {
      getDeviceDecryptionChallenge({
        variables: deviceDecryptionChallengeVariables
      })
    }, LOGIN_DECRYPTION_CHALLENGE_REFETCH_INTERVAL)

    return () => {
      window.clearInterval(interval)
    }
  }, [getDeviceDecryptionChallenge, deviceDecryptionChallengeVariables])

  const deviceDecryptionChallenge = decryptionData?.deviceDecryptionChallenge

  useEffect(() => {
    const fireToken = device.fireToken || `web-ext-${crypto.randomUUID()}`

    if (
      deviceDecryptionChallenge?.__typename === 'DecryptionChallengeApproved'
    ) {
      ;(async () => {
        const addDeviceSecretEncrypted =
          deviceDecryptionChallenge.addDeviceSecretEncrypted
        const userId = deviceDecryptionChallenge.userId

        if (!addDeviceSecretEncrypted || !userId) {
          toast({
            title: t`Login failed, try removing and adding the extension again`,
            status: 'error',
            isClosable: true
          })
          return
        }

        if (!deviceDecryptionChallenge.id) {
          toast({
            title: t`Failed to create decryption challenge`,
            status: 'error',
            isClosable: true
          })
          return
        }

        const encryptionSalt = deviceDecryptionChallenge.encryptionSalt
        const masterEncryptionKey = await generateEncryptionKey(
          formStateContext.password,
          base64ToBuffer(encryptionSalt)
        )

        let currentAddDeviceSecret: string | null = null
        try {
          const encryptedDataBuff = base64ToBuffer(addDeviceSecretEncrypted)
          const iv = encryptedDataBuff.slice(16, 16 + 12)
          const data = encryptedDataBuff.slice(16 + 12)
          const decryptedContent = await self.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            masterEncryptionKey,
            data
          )
          currentAddDeviceSecret = dec.decode(decryptedContent)
        } catch (error) {
          console.error(error)
        }

        if (!currentAddDeviceSecret) {
          toast({
            title: t`Login failed, check your email or password`,
            status: 'error',
            isClosable: true
          })
          setFormStateContext({
            ...formStateContext,
            isSubmitted: false
          })
          return
        }

        const newDeviceSecretsPair = await device.initLocalDeviceAuthSecret(
          masterEncryptionKey,
          base64ToBuffer(encryptionSalt)
        )

        const response = await addNewDevice({
          variables: {
            email: formStateContext.email,
            deviceId: device.id as string,
            deviceInput: {
              id: device.id as string,
              name: props.deviceName,
              platform: device.platform
            },
            input: {
              addDeviceSecret: newDeviceSecretsPair.addDeviceSecret,
              addDeviceSecretEncrypted:
                newDeviceSecretsPair.addDeviceSecretEncrypted,
              firebaseToken: fireToken,
              devicePlatform: device.platform,
              encryptionSalt
            },
            currentAddDeviceSecret
          }
        })

        await browser.storage.local.set({
          addDeviceSecretEncrypted,
          currentAddDeviceSecret
        })

        const addNewDeviceForUser =
          response.data?.deviceDecryptionChallenge?.__typename ===
          'DecryptionChallengeApproved'
            ? response.data.deviceDecryptionChallenge.addNewDeviceForUser
            : null

        if (!addNewDeviceForUser?.accessToken) {
          toast({
            title: t`Login failed, check your username or password`,
            status: 'error',
            isClosable: true
          })
          return
        }

        await setAccessToken(addNewDeviceForUser.accessToken)
        const decodedToken = await getUserFromToken()
        if (!decodedToken) {
          throw new Error('Missing access token after login approval')
        }

        const encryptedSecrets = addNewDeviceForUser.user.EncryptedSecrets
        const deviceState: IBackgroundStateSerializable = {
          masterEncryptionKey: await cryptoKeyToString(masterEncryptionKey),
          userId,
          secrets: encryptedSecrets,
          email: formStateContext.email,
          encryptionSalt,
          deviceName: props.deviceName,
          authSecret: newDeviceSecretsPair.addDeviceSecret,
          authSecretEncrypted: newDeviceSecretsPair.addDeviceSecretEncrypted,
          vaultLockTimeoutSeconds:
            addNewDeviceForUser.user.device.vaultLockTimeoutSeconds,
          autofillTOTPEnabled:
            addNewDeviceForUser.user.device.autofillTOTPEnabled,
          autofillCredentialsEnabled:
            addNewDeviceForUser.user.device.autofillCredentialsEnabled,
          uiLanguage: addNewDeviceForUser.user.uiLanguage,
          syncTOTP: addNewDeviceForUser.user.device.syncTOTP,
          notificationOnWrongPasswordAttempts:
            addNewDeviceForUser.user.notificationOnWrongPasswordAttempts,
          notificationOnVaultUnlock:
            addNewDeviceForUser.user.notificationOnVaultUnlock,
          theme: addNewDeviceForUser.user.defaultDeviceSettings.theme
        }

        if (
          colorMode !== addNewDeviceForUser.user.defaultDeviceSettings.theme
        ) {
          toggleColorMode()
        }

        setUserId(decodedToken.userId)
        device.save(deviceState)

        toast({
          title: t`Device approved at ${formatRelative(
            new Date(),
            new Date(deviceDecryptionChallenge.approvedAt as string)
          )}`,
          status: 'success',
          isClosable: true
        })
      })()
    } else if (!deviceDecryptionChallenge) {
      getDeviceDecryptionChallenge({ variables: deviceDecryptionChallengeVariables })
    }
  }, [
    addNewDevice,
    colorMode,
    deviceDecryptionChallenge,
    deviceDecryptionChallengeVariables,
    formStateContext,
    getDeviceDecryptionChallenge,
    props.deviceName,
    setFormStateContext,
    setUserId,
    toggleColorMode
  ])

  return { deviceDecryptionChallenge, loading, formState: formStateContext }
}

export const LoginAwaitingApproval = () => {
  const [deviceName] = useState(device.generateDeviceName())
  const { deviceDecryptionChallenge, formState } = useLogin({ deviceName })
  const [initiateMasterDeviceReset, { loading: resetMasterDeviceLoading }] =
    useInitiateMasterDeviceResetMutation({
      onCompleted: ({ initiateMasterDeviceReset }) => {
        toast({
          title: t`Master device reset confirmation email sent`,
          description: `${t`After you confirm the email link, reset is scheduled for`} ${new Date(
            initiateMasterDeviceReset.processAt
          ).toLocaleString()}`,
          status: 'warning',
          isClosable: true
        })
      },
      onError: () => {
        toast({
          title: t`Failed to schedule master device reset`,
          status: 'error',
          isClosable: true
        })
      }
    })

  if (!deviceDecryptionChallenge) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-[color:var(--color-border)] border-t-[color:var(--color-primary)]" />
      </div>
    )
  }

  if (
    deviceDecryptionChallenge.id &&
    deviceDecryptionChallenge.__typename === 'DecryptionChallengeForApproval'
  ) {
    const pendingResetAt = deviceDecryptionChallenge.masterDeviceResetProcessAt
    const confirmedResetAt =
      deviceDecryptionChallenge.masterDeviceResetConfirmedAt
    const requestedResetAt =
      deviceDecryptionChallenge.masterDeviceResetRequestedAt
    const rejectedResetAt =
      deviceDecryptionChallenge.masterDeviceResetRejectedAt

    return (
      <div className="extension-surface min-w-[600px] rounded-[var(--radius-lg)] border border-[color:var(--color-border)] p-8 shadow-lg">
        <h2 className="mb-2 text-sm font-semibold text-[color:var(--color-muted)]">
          <Trans>Username: {formState.email}</Trans>
        </h2>
        <div className="flex items-center gap-3">
          <IoWarningOutline className="size-8 text-amber-300" />
          <h3 className="text-lg font-semibold text-[color:var(--color-foreground)]">
            <Trans>Device: </Trans>
          </h3>
          <div className="text-sm">{deviceName}</div>
        </div>
        <div className="mt-3 flex justify-center">
          <div className="flex flex-col">
            <Txt fontSize="md" mb={2}>
              <Trans>
                Approve this device in your device management in the vault on
                your master device in order to proceed adding new device.
              </Trans>
            </Txt>

            <Txt fontSize="sm">
              <Trans>
                After you approve it, the vault password will be checked and
                your vault will open automatically in this tab.
              </Trans>
            </Txt>

            <Txt fontSize="sm" mt={3}>
              <Trans>
                Push notifications sent:{' '}
                {deviceDecryptionChallenge.pushNotificationsSentCount}
              </Trans>
            </Txt>
            <Txt fontSize="sm" mb={3}>
              <Trans>
                Push notifications failed:{' '}
                {deviceDecryptionChallenge.pushNotificationsFailedCount}
              </Trans>
            </Txt>

            {pendingResetAt ? (
              <Txt fontSize="sm" mb={3}>
                <Trans>
                  Master device reset scheduled for{' '}
                  {new Date(pendingResetAt).toLocaleString()}.
                </Trans>
              </Txt>
            ) : null}

            {requestedResetAt && !confirmedResetAt && !rejectedResetAt ? (
              <Txt fontSize="sm" mb={3}>
                <Trans>
                  Master device reset confirmation email sent. Confirm the email
                  link to arm the reset.
                </Trans>
              </Txt>
            ) : null}

            {rejectedResetAt ? (
              <Txt fontSize="sm" mb={3}>
                <Trans>
                  Master device reset was rejected at{' '}
                  {new Date(rejectedResetAt).toLocaleString()}.
                </Trans>
              </Txt>
            ) : null}

            <Button
              disabled={Boolean(requestedResetAt && !rejectedResetAt) || resetMasterDeviceLoading}
              onClick={async () => {
                await initiateMasterDeviceReset({
                  variables: {
                    email: formState.email,
                    deviceInput: {
                      id: device.id as string,
                      name: deviceName,
                      platform: device.platform
                    },
                    decryptionChallengeId: deviceDecryptionChallenge.id
                  }
                })
              }}
              variant="destructive"
            >
              <Trans>Reset master device</Trans>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
