import { resolve } from 'node:path'
import { generateOpenApiDocument } from '../orpc/openapi'

const path = resolve(import.meta.dir, '../../shared/openapi/authier.json')
const output = `${JSON.stringify(await generateOpenApiDocument(), null, 2)}\n`
if (process.argv.includes('--check')) {
  if ((await Bun.file(path).text()) !== output) {
    throw new Error(
      'OpenAPI specification is stale. Run pnpm --dir backend api:generate.'
    )
  }
} else {
  await Bun.write(path, output)
}
console.log(`OpenAPI specification: ${path}`)
