import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import React from 'react'

export function useVaultLockTimeoutOptions() {
  const { i18n } = useLingui()

  return React.useMemo(
    () => [
      { value: 60, label: t(i18n)`1 minute` },
      { value: 300, label: t(i18n)`5 minutes` },
      { value: 600, label: t(i18n)`10 minutes` },
      { value: 1800, label: t(i18n)`30 minutes` },
      { value: 3600, label: t(i18n)`1 hour` },
      { value: 7200, label: t(i18n)`2 hours` },
      { value: 14400, label: t(i18n)`4 hours` },
      { value: 28800, label: t(i18n)`8 hours` },
      { value: 43200, label: t(i18n)`12 hours` },
      { value: 86400, label: t(i18n)`1 day` },
      { value: 172800, label: t(i18n)`2 days` },
      { value: 259200, label: t(i18n)`3 days` },
      { value: 604800, label: t(i18n)`1 week` },
      { value: 1209600, label: t(i18n)`2 weeks` },
      { value: 2592000, label: t(i18n)`31 days` },
      { value: 5184000, label: t(i18n)`2 months` },
      { value: 7776000, label: t(i18n)`3 months` },
      { value: 15552000, label: t(i18n)`6 months` },
      { value: 31536000, label: t(i18n)`1 year` },
      { value: 0, label: t(i18n)`Never` }
    ],
    [i18n]
  )
}
