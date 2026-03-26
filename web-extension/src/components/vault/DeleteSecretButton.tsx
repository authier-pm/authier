import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Button } from '@src/components/ui/button'
import { Tooltip } from '@src/components/ui/tooltip'
import { plural } from '@lingui/core/macro'
import {
  useDeleteEncryptedSecretMutation,
  useRemoveEncryptedSecretsMutation
} from '@shared/graphql/EncryptedSecrets.codegen'
import { SecretTypeUnion, device } from '@src/background/ExtensionDevice'
import { DeleteAlert } from '@src/components/vault/DeleteAlert'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'
import { useContext } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DeleteIcon } from '@src/components/ui/icons'
import { cn } from '@src/lib/cn'

interface DeleteSecretButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  secrets: SecretTypeUnion[]
  'aria-label'?: string
  size?: 'sm' | 'md' | 'lg' | 'icon'
  children?: ReactNode
}

export const DeleteSecretButton = ({
  secrets,
  children,
  className,
  size,
  ...props
}: DeleteSecretButtonProps) => {
  const { setSelectedItems } = useContext(DeviceStateContext)
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const [deleteEncryptedSecretMutation] = useDeleteEncryptedSecretMutation()
  const [removeEncryptedSecrets] = useRemoveEncryptedSecretsMutation()
  const label = plural(secrets.length, {
    one: `delete secret`,
    other: `delete # secrets`
  })

  return (
    <>
      <Tooltip content={label}>
        {children ? (
          <Button
            {...props}
            aria-label={label}
            className={cn('w-full', className)}
            onClick={() => setIsOpen(true)}
            size={size}
            variant="destructive"
          >
            <DeleteIcon boxSize={16} />
            {children}
          </Button>
        ) : (
          <Button
            {...props}
            aria-label={label}
            className={className}
            onClick={() => setIsOpen(true)}
            size={size ?? 'icon'}
            variant="ghost"
          >
            <DeleteIcon boxSize={16} />
          </Button>
        )}
      </Tooltip>
      <DeleteAlert
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        deleteItem={async () => {
          if (secrets.length > 1) {
            const input = secrets.map(({ id }) => id)
            await removeEncryptedSecrets({ variables: { secrets: input } })

            device.state?.removeSecrets(input)
            setSelectedItems([])
          } else {
            await deleteEncryptedSecretMutation({
              variables: { id: secrets[0].id }
            })
            await device.state?.removeSecret(secrets[0].id)

            if (location.pathname.includes(secrets[0].id)) {
              navigate('/')
            }
          }
        }}
      />
    </>
  )
}
