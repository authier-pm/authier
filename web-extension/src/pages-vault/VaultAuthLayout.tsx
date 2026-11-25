import type { PropsWithChildren } from 'react'

export function VaultAuthLayout({ children }: PropsWithChildren) {
  return (
    <main className="extension-scrollbar h-full overflow-y-auto" tabIndex={0}>
      <div className="flex min-h-full items-center justify-center p-4">
        {children}
      </div>
    </main>
  )
}
