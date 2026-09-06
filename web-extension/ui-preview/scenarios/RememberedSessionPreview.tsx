import { useEffect, useState } from 'react'
import { readRememberedVault, rememberVault } from '@shared/rememberedVault'
import { AutofillControlsPreview } from './AutofillControlsPreview'

/** The normal unlocked popup, restored through the real encrypted snapshot store. */
export const RememberedSessionPreview = () => {
  const [restored, setRestored] = useState(false)
  useEffect(() => {
    let cancelled = false
    void readRememberedVault().then(async (snapshot) => {
      if (!snapshot) {
        if (new URLSearchParams(location.search).has('requireRemembered')) {
          throw new Error(
            'The remembered snapshot did not survive the browser restart'
          )
        }
        await rememberVault({ previewAccount: 'user@example.com' })
      }
      if (!cancelled) setRestored(true)
    })
    return () => {
      cancelled = true
    }
  }, [])
  return restored ? <AutofillControlsPreview /> : null
}
