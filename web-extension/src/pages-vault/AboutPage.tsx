import pkg from '../../package.json'
import { Trans } from '@lingui/react/macro'

export const AboutPage = () => {
  return (
    <div className="flex min-h-[60%] min-w-[300px] items-center justify-center p-4">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-xl font-semibold text-[color:var(--color-foreground)]">
          Authier web extension
        </h1>
        <p className="text-lg text-[color:var(--color-muted)]">
          <Trans>Version: {pkg.version}</Trans>
        </p>
      </div>
    </div>
  )
}
