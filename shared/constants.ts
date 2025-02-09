import { t } from '@lingui/macro'
import { i18n } from '@lingui/core'

i18n.activate('en')

export const PBKDF2Iterations = 600000 // 600k same as bitwarden

// use this for all select options
export const vaultLockTimeoutOptions = [
  { value: 60, label: t`1 minute` },
  { value: 300, label: t`5 minutes` },
  { value: 600, label: t`10 minutes` },
  { value: 1800, label: t`30 minutes` },
  { value: 3600, label: t`1 hour` },
  { value: 7200, label: t`2 hours` },
  { value: 14400, label: t`4 hours` },
  { value: 28800, label: t`8 hours` },
  { value: 43200, label: t`12 hours` },
  { value: 86400, label: t`1 day` },
  { value: 172800, label: t`2 days` },
  { value: 259200, label: t`3 days` },
  { value: 604800, label: t`1 week` },
  { value: 1209600, label: t`2 weeks` },
  { value: 2592000, label: t`31 days` },
  { value: 5184000, label: t`2 months` },
  { value: 7776000, label: t`3 months` },
  { value: 15552000, label: t`6 months` },
  { value: 31536000, label: t`1 year` },
  { value: 0, label: t`Never` }
]
