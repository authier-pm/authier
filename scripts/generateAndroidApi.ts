import { createHash } from 'node:crypto'
import { cp, mkdir, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

// Pin both the generator and its bytes so regeneration is reproducible.
const version = '7.25.0'
const sha256 =
  '41ce4f6b07f196676439d710759fa1ced7a08066d06ff1bf314681470289efae'
const root = fileURLToPath(new URL('..', import.meta.url))
const cache = join(root, '.cache/openapi-generator')
const jar = join(cache, `openapi-generator-cli-${version}.jar`)
const output = join(cache, 'android-client')
const packagePath = 'dev/authier/android/generated'
const destination = join(root, 'android-app/app/src/main/java', packagePath)

// The generator does not yet infer primitives from JSON Schema `const`, and
// UUID serializers otherwise need a JVM-only contextual adapter. These changes
// affect Kotlin representation only; the published contract retains validation.
const forKotlin = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(forKotlin)
  if (typeof value !== 'object' || value === null) return value
  const result: Record<string, unknown> = Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, forKotlin(entry)])
  )
  if (result.format === 'uuid') delete result.format
  if ('const' in result) {
    result.type = typeof result.const
    if (typeof result.const === 'string') result.enum = [result.const]
    delete result.const
  }
  return result
}

await mkdir(cache, { recursive: true })
if (!(await Bun.file(jar).exists())) {
  const response = await fetch(
    `https://repo.maven.apache.org/maven2/org/openapitools/openapi-generator-cli/${version}/openapi-generator-cli-${version}.jar`
  )
  if (!response.ok)
    throw new Error(`Generator download failed: ${response.status}`)
  await Bun.write(jar, response)
}
const hash = createHash('sha256')
  .update(new Uint8Array(await Bun.file(jar).arrayBuffer()))
  .digest('hex')
if (hash !== sha256) throw new Error('OpenAPI Generator checksum mismatch')

await rm(output, { recursive: true, force: true })
const input = join(cache, 'kotlinSchema.json')
await Bun.write(
  input,
  JSON.stringify(
    forKotlin(await Bun.file(join(root, 'shared/openapi/authier.json')).json())
  )
)
const result = Bun.spawnSync(
  [
    'java',
    '-jar',
    jar,
    'generate',
    '-i',
    input,
    '-g',
    'kotlin',
    '--library',
    'jvm-retrofit2',
    '--api-package',
    'dev.authier.android.generated.api',
    '--model-package',
    'dev.authier.android.generated.model',
    '--package-name',
    'dev.authier.android.generated',
    '--schema-mappings',
    'EmptyInput=kotlinx.serialization.json.JsonObject',
    '--additional-properties',
    'serializationLibrary=kotlinx_serialization,generateOneOfAnyOfWrappers=true,useCoroutines=true,useResponseAsReturnType=false,dateLibrary=string,enumPropertyNaming=UPPERCASE,sourceFolder=src/main/java,hideGenerationTimestamp=true',
    '--global-property',
    'apis,models,supportingFiles=CollectionFormats.kt,apiTests=false,modelTests=false,apiDocs=false,modelDocs=false',
    '-o',
    output
  ],
  { cwd: root, stdout: 'inherit', stderr: 'inherit' }
)
if (result.exitCode !== 0)
  throw new Error(`Kotlin generation failed: ${result.exitCode}`)

const generated = join(output, 'src/main/java', packagePath)
// OpenAPI Generator renders the empty-object request schema as Any despite a
// schema mapping. kotlinx.serialization needs a concrete empty JSON object.
// Unconstrained error data is JSON, represented by JsonElement rather than Any.
for await (const path of new Bun.Glob('**/*.kt').scan(generated)) {
  const file = join(generated, path)
  const source = await Bun.file(file).text()
  await Bun.write(
    file,
    source
      .replaceAll(
        '@Body body: kotlin.Any',
        '@Body body: kotlinx.serialization.json.JsonObject'
      )
      .replaceAll('kotlin.Any', 'kotlinx.serialization.json.JsonElement')
      .replaceAll(/[\t ]+$/gm, '')
      .trimEnd() + '\n'
  )
}
if (process.argv.includes('--check')) {
  const paths = (
    await Array.fromAsync(new Bun.Glob('**/*.kt').scan(generated))
  ).sort()
  const existing = (
    await Array.fromAsync(new Bun.Glob('**/*.kt').scan(destination))
  ).sort()
  if (JSON.stringify(paths) !== JSON.stringify(existing))
    throw new Error(
      'Generated Kotlin file list is stale. Run pnpm android:api.'
    )
  for (const path of paths) {
    if (
      (await Bun.file(join(generated, path)).text()) !==
      (await Bun.file(join(destination, path)).text())
    ) {
      throw new Error(
        `Generated Kotlin file is stale: ${path}. Run pnpm android:api.`
      )
    }
  }
  console.log('Generated Kotlin API matches the OpenAPI contract')
} else {
  // Replace only generated code; application code lives outside this package.
  await rm(destination, { recursive: true, force: true })
  await cp(generated, destination, { recursive: true })
  console.log('Generated Kotlin API from shared/openapi/authier.json')
}
