import { runBackendModule } from './runBackendModule'

const vite = await runBackendModule('/scripts/generateGqlSchemas.ts')
await vite.close()
