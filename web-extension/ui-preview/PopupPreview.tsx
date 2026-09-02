import { type PropsWithChildren } from 'react'
import { IoMdArchive } from 'react-icons/io'
import { IoLockClosed } from 'react-icons/io5'
import { TbRefresh } from 'react-icons/tb'
import { AutofillControl } from '@src/components/AutofillControl'
import { Button } from '@src/components/ui/button'
import { ScreenshotDeviceStateProvider } from './deviceStateProvider'

export const PopupPreview = ({ children }: PropsWithChildren) => (
  <ScreenshotDeviceStateProvider>
    <div className="min-h-[440px] w-[350px]" data-ui-preview>
      <div className="extension-surface sticky top-0 z-20 flex w-full flex-col border-b border-[color:var(--color-border)]">
        <div className="flex items-center gap-2 px-2 py-2">
          <Button
            aria-label="Add item"
            className="rounded-full text-lg"
            size="icon"
            variant="primary"
          >
            +
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <Button aria-label="Open menu" size="icon" variant="outline">
              <IoLockClosed className="size-4" />
            </Button>
            <Button aria-label="Refresh secrets" size="icon" variant="outline">
              <TbRefresh className="size-4" />
            </Button>
            <Button aria-label="Open vault" size="icon" variant="outline">
              <IoMdArchive className="size-4" />
            </Button>
            <AutofillControl />
          </div>
        </div>
      </div>

      {children}
    </div>
  </ScreenshotDeviceStateProvider>
)
