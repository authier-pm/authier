import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { openAutofillSafetyCorpusV1 } from './corpus'

const outputUrl = new URL(
  '../../landing-page/public/research/autofill-safety-corpus-v1.json',
  import.meta.url
)
const checksumOutputUrl = new URL(
  '../../landing-page/public/research/autofill-safety-corpus-v1.sha256',
  import.meta.url
)
const outputPath = fileURLToPath(outputUrl)
const checksumOutputPath = fileURLToPath(checksumOutputUrl)
const serializedCorpus = `${JSON.stringify(openAutofillSafetyCorpusV1, null, 2)}\n`
const checksum = createHash('sha256').update(serializedCorpus).digest('hex')

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, serializedCorpus, 'utf8')
await writeFile(
  checksumOutputPath,
  `${checksum}  autofill-safety-corpus-v1.json\n`,
  'utf8'
)

console.log(`${outputPath}\n${checksumOutputPath}`)
