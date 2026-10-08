import { PasskeyCreationSettings } from '@src/components/vault/settings/PasskeyCreationSettings'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@src/components/ui/card'

export function PasskeyCreationSettingsPreview() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl p-6 sm:p-10">
      <p className="mb-2 text-sm text-[color:var(--color-muted)]">
        Settings / Security
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Security behavior</CardTitle>
        </CardHeader>
        <CardContent>
          <PasskeyCreationSettings />
        </CardContent>
      </Card>
    </main>
  )
}
