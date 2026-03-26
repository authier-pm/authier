import { type FunctionComponent, useContext } from 'react'
import { IoAdd } from 'react-icons/io5'
import { AddTOTPSecretButton } from '@src/components/pages/AddTOTPSecretButton'
import { Button } from '@src/components/ui/button'
import { openVaultTab } from '@src/AuthLinkPage'
import { DeviceStateContext } from '@src/providers/DeviceStateProvider'

export const AddSecretNavMenu: FunctionComponent = () => {
  const { currentURL } = useContext(DeviceStateContext)

  return (
    <div className="border-t border-[color:var(--color-border)] bg-[color:var(--color-accent)]/40 px-3 py-3">
      <div className="flex flex-col gap-2">
        <Button
          className="justify-start"
          variant="secondary"
          onClick={() => {
            openVaultTab('/addItem?url=' + currentURL)
          }}
        >
          <IoAdd className="size-4" />
          Add manually
        </Button>
        <AddTOTPSecretButton />
      </div>
    </div>
  )
}
