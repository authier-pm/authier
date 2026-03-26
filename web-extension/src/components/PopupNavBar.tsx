import { type FunctionComponent, useState } from 'react'
import { t } from '@lingui/core/macro'
import { IoMdArchive } from 'react-icons/io'
import { IoAdd, IoClose, IoLockClosed } from 'react-icons/io5'
import { openVaultTab } from '@src/AuthLinkPage'
import { AddSecretNavMenu } from '@src/pages/AddSecretNavMenu'
import { UserNavMenu } from '@src/pages/UserNavMenu'
import { Button } from '@src/components/ui/button'
import { Tooltip } from '@src/components/ui/tooltip'
import { RefreshSecretsButton } from './RefreshSecretsButton'

export const PopupNavBar: FunctionComponent = () => {
  const [isAddSecretNavMenuOpen, setIsAddSecretNavMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  return (
    <div className="extension-surface sticky top-0 z-20 flex w-full flex-col border-b border-[color:var(--color-border)]">
      <div className="flex items-center gap-2 px-2 py-2">
        <Button
          aria-label="menu"
          size="icon"
          variant={isUserMenuOpen ? 'secondary' : 'outline'}
          onClick={() => {
            setIsUserMenuOpen((currentValue) => {
              const nextValue = !currentValue

              if (nextValue) {
                setIsAddSecretNavMenuOpen(false)
              }

              return nextValue
            })
          }}
        >
          {isUserMenuOpen ? (
            <IoClose className="size-4" />
          ) : (
            <IoLockClosed className="size-4" />
          )}
        </Button>

        <RefreshSecretsButton />

        <Tooltip
          content={isAddSecretNavMenuOpen ? t`close menu` : t`add secret`}
        >
          <Button
            aria-label="Add item"
            className="rounded-full"
            size="icon"
            variant="primary"
            onClick={() => {
              setIsAddSecretNavMenuOpen((currentValue) => {
                const nextValue = !currentValue

                if (nextValue) {
                  setIsUserMenuOpen(false)
                }

                return nextValue
              })
            }}
          >
            {isAddSecretNavMenuOpen ? (
              <IoClose className="size-4" />
            ) : (
              <IoAdd className="size-4" />
            )}
          </Button>
        </Tooltip>

        <div className="ml-auto">
          <Tooltip content={t`Open vault`}>
            <Button
              aria-label="Open vault"
              size="icon"
              variant="outline"
              onClick={() => {
                openVaultTab()
              }}
            >
              <IoMdArchive className="size-4" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {isAddSecretNavMenuOpen ? <AddSecretNavMenu /> : null}
      {isUserMenuOpen ? <UserNavMenu /> : null}
    </div>
  )
}
