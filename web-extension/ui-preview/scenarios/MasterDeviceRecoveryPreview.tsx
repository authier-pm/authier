import { useState } from 'react'
import { MasterDeviceResetSetup } from '@shared/MasterDeviceResetSetup'
import { MasterDeviceResetProgress } from '@shared/MasterDeviceResetProgress'
import {
  defaultMasterDeviceResetConfig,
  type MasterDeviceResetConfig
} from '@shared/masterDeviceResetConfig'

export function MasterDeviceRecoveryPreview() {
  const [saved, setSaved] = useState<MasterDeviceResetConfig | null>(null)
  return (
    <main className="min-h-screen px-4 py-10" data-ui-preview>
      <div className="mx-auto max-w-[600px]">
        <p className="mb-5 text-sm font-semibold tracking-widest text-teal-400">
          AUTHIER{' '}
          <span className="ml-3 font-normal tracking-normal text-[color:var(--color-muted)]">
            Create your vault · Step 2 of 2
          </span>
        </p>
        <div className="extension-surface rounded-3xl border border-[color:var(--color-border)] p-6 sm:p-8 shadow-lg">
          <MasterDeviceResetSetup
            email="alex@example.com"
            initialConfig={defaultMasterDeviceResetConfig}
            onSave={(config) => {
              setSaved(config)
            }}
          />
          {saved && (
            <output data-testid="saved-config">{JSON.stringify(saved)}</output>
          )}
        </div>
      </div>
    </main>
  )
}

export function MasterDeviceResetProgressPreview() {
  return (
    <main
      className="mx-auto min-h-screen max-w-[600px] px-4 py-10"
      data-ui-preview
    >
      <h1 className="mb-6 text-2xl font-semibold">
        Recovering your master device
      </h1>
      <MasterDeviceResetProgress
        status={{
          requiredApprovals: 2,
          approvalCount: 1,
          processAt: '2026-09-22T12:00:00Z',
          confirmedAt: '2026-09-20T12:00:00Z'
        }}
      />
      <p className="text-sm text-[color:var(--color-muted)]">
        Open Devices on another existing device to approve or cancel this reset.
      </p>
    </main>
  )
}
