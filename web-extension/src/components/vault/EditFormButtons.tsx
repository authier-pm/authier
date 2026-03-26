import { useNavigate } from 'react-router-dom'
import { useFormikContext } from 'formik'
import { IoDuplicate } from 'react-icons/io5'
import { FiArrowLeft } from 'react-icons/fi'
import { t } from '@lingui/core/macro'
import { EncryptedSecretType } from '@shared/generated/graphqlBaseTypes'
import { useAppToast } from '@src/ExtensionProviders'
import { Button } from '@src/components/ui/button'
import { Tooltip } from '@src/components/ui/tooltip'
import { SecretTypeUnion } from '@src/background/ExtensionDevice'
import { DeleteSecretButton } from './DeleteSecretButton'

export const EditFormButtons = ({ secret }: { secret?: SecretTypeUnion }) => {
  const navigate = useNavigate()
  const toast = useAppToast()
  const { dirty, isSubmitting } = useFormikContext<Record<string, unknown>>()

  return (
    <div className="flex flex-col gap-3 border-t border-[color:var(--color-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
      <Button
        onClick={() => {
          const canGoBack = window.history.length > 1

          if (canGoBack) {
            navigate(-1)
            return
          }

          navigate('/')
        }}
        type="button"
        variant="outline"
      >
        <FiArrowLeft className="size-4" />
        Go back
      </Button>

      <div className="flex flex-wrap items-center gap-2">
        {secret ? (
          <>
            <DeleteSecretButton secrets={[secret]} size="sm">
              Delete
            </DeleteSecretButton>

            <Tooltip content={t`Copy whole secret`}>
              <Button
                onClick={() => {
                  let stringified

                  if (secret.kind === EncryptedSecretType.TOTP) {
                    stringified = JSON.stringify(secret.totp)
                  } else {
                    stringified = `url: ${secret.loginCredentials.url}\nlabel: ${secret.loginCredentials.label}\nusername: ${secret.loginCredentials.username}\npassword: ${secret.loginCredentials.password}`
                  }

                  navigator.clipboard.writeText(stringified)
                  toast({
                    title: t`Copied to clipboard`,
                    status: 'success'
                  })
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                <IoDuplicate className="size-4" />
                Copy secret
              </Button>
            </Tooltip>
          </>
        ) : null}

        <Button aria-label="Save" disabled={isSubmitting || !dirty} type="submit">
          {isSubmitting ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}
