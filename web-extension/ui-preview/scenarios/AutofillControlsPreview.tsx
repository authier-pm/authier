import { TbWorld } from 'react-icons/tb'
import { Input } from '@src/components/ui/input'
import { Switch } from '@src/components/ui/switch'
import { PopupPreview } from '../PopupPreview'

export const AutofillControlsPreview = () => (
  <PopupPreview>
    <div className="px-2 pb-2">
      <div className="mt-2 flex items-center gap-2 px-2">
        <label className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-[color:var(--color-foreground)]">
          <span className="inline-flex items-center gap-1.5 text-[color:var(--color-muted)]">
            <TbWorld className="size-4" />
            Site
          </span>
          <Switch checked onCheckedChange={() => undefined} />
        </label>
        <Input className="h-9 min-w-0" placeholder="Search" />
      </div>

      <div className="mt-5 grid gap-3 px-2">
        <div className="extension-surface rounded-[var(--radius-lg)] border border-[color:var(--color-border)] p-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-accent)] font-semibold text-[color:var(--color-primary)]">
              A
            </div>
            <div>
              <div className="text-sm font-semibold">Example account</div>
              <div className="text-sm text-[color:var(--color-muted)]">
                user@example.com
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PopupPreview>
)
