import jsFileDownload from 'js-file-download'
import slugify from 'slugify'
import { formatISO } from 'date-fns'

export const downloadAsFile = (
  fileData: string,
  prefix: string,
  extension = 'csv'
) => {
  jsFileDownload(
    fileData,
    `${prefix}-${slugify(formatISO(new Date()), {
      replacement: '-'
    })}.${extension}`
  )
}
