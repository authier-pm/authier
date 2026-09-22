import { useContext, useState } from 'react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import type { QRCode } from 'jsqr'
import { TbPhoto } from 'react-icons/tb'
import { v4 as uuidv4 } from 'uuid'
import browser, { Tabs } from 'webextension-polyfill'
import { device } from '@src/background/ExtensionDevice'
import { Button } from '@src/components/ui/button'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { getCurrentTab } from '@src/util/executeScriptInCurrentTab'
import { getQrCodeFromUrl } from '@src/util/getQrCodeFromUrl'
import { ITOTPSecret } from '@src/util/useDeviceState'
import { toast } from '@src/ExtensionProviders'
import { useLimitsQuery } from '@shared/graphql/AccountLimits.codegen'
import { EncryptedSecretType } from '../../../../shared/generated/graphqlBaseTypes'
import { constructURL } from '@shared/urlUtils'
import { formatTotpLabel } from '@shared/totpLabel'
import { parseTotpProvisioning } from '@src/util/totpProvisioning'
import { resolveTotpAccountEmail } from '@src/util/totpAccountEmail'
import { TotpAccountForm } from './TotpAccountForm'

export const AddTOTPSecretButton = () => {
  const { deviceState, TOTPSecrets } = useContext(DeviceStateContext)
  const { data } = useLimitsQuery()
  const [isLoading, setIsLoading] = useState(false)
  const [pendingAccount, setPendingAccount] = useState<{
    qr: Pick<QRCode, 'data'>
    tab: Tabs.Tab
    provider: string
  } | null>(null)

  const addToTOTPs = async (
    qr: Pick<QRCode, 'data'>,
    tab: Tabs.Tab,
    email?: string,
    provider?: string
  ) => {
    const TOTPCount =
      device.state?.secrets.filter((s) => s.kind === EncryptedSecretType.TOTP)
        .length ?? 0
    const TOTPLimit = data?.me.TOTPlimit ?? 0

    if (TOTPCount >= TOTPLimit) {
      toast({
        title: t`You have reached your password limit. Please upgrade your account to add more passwords.`,
        status: 'error',
        isClosable: true
      })
      console.log(
        'You have reached your password limit. Please upgrade your account to add more passwords.'
      )
      return
    }

    if (!tab || !deviceState) {
      return
    }

    const provisioning = parseTotpProvisioning(qr.data)
    const accountEmail =
      email ?? (await resolveTotpAccountEmail(provisioning.accountEmail, tab))
    if (!accountEmail) {
      setPendingAccount({ qr, tab, provider: provisioning.provider })
      return
    }

    const newTotpSecret = await getTokenSecretFromQrCode(
      qr,
      tab,
      accountEmail,
      provider
    )
    const existingTotpSecret = TOTPSecrets.find(
      ({ totp }) => newTotpSecret.totp.secret === totp.secret
    )

    if (existingTotpSecret) {
      setPendingAccount(null)
      toast({
        title: t`This TOTP secret is already in your vault`,
        status: 'success',
        isClosable: true
      })
      return
    }

    await device.state?.addSecrets([newTotpSecret])
    setPendingAccount(null)
    toast({
      title: t`Successfully added TOTP for ${newTotpSecret.totp.label}`,
      status: 'success',
      isClosable: true
    })
  }

  if (pendingAccount) {
    return (
      <TotpAccountForm
        provider={pendingAccount.provider}
        onCancel={() => setPendingAccount(null)}
        onSave={(email, provider) =>
          addToTOTPs(pendingAccount.qr, pendingAccount.tab, email, provider)
        }
      />
    )
  }

  return (
    <Button
      className="justify-start"
      disabled={isLoading}
      variant="outline"
      onClick={async () => {
        setIsLoading(true)
        try {
          const tab = await getCurrentTab()
          if (!tab) return
          const src = await browser.tabs.captureVisibleTab(tab.windowId)
          const qr = await getQrCodeFromUrl(src)

          if (qr) {
            await addToTOTPs(qr, tab)
          } else {
            toast({
              title: t`could not find any QR code on this page. Make sure QR code is visible.`,
              status: 'error',
              isClosable: true
            })
          }
        } finally {
          setIsLoading(false)
        }
      }}
    >
      <TbPhoto className={isLoading ? 'animate-pulse' : undefined} />
      <Trans>Add QR TOTP from current page</Trans>
    </Button>
  )
}

export async function getTokenSecretFromQrCode(
  qr: Pick<QRCode, 'data'>,
  tab: Pick<Tabs.Tab, 'id' | 'url' | 'favIconUrl' | 'incognito'>,
  email?: string,
  provider?: string
): Promise<ITOTPSecret> {
  const provisioning = parseTotpProvisioning(qr.data)
  const accountEmail = await resolveTotpAccountEmail(
    provisioning.accountEmail ?? email,
    tab
  )
  const label = formatTotpLabel(
    accountEmail ?? '',
    provider ?? provisioning.provider
  )

  if (!device.state) {
    throw new Error('device not initialized')
  }
  if (!tab.url) {
    throw new Error('Current tab does not have a URL')
  }

  const encrypted = await device.state.encrypt(provisioning.secret)
  const hostname = constructURL(tab.url).hostname

  return {
    id: uuidv4(),
    kind: EncryptedSecretType.TOTP,
    totp: {
      secret: provisioning.secret,
      digits: 6,
      period: 30,
      iconUrl: tab.favIconUrl ?? null,
      label,
      url: hostname
    },
    createdAt: new Date().toJSON(),
    encrypted
  }
}
