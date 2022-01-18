import { Box, Button, Flex, Heading } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import {
  ExportLoginCredentialsToCsvButton,
  ExportTOTPToCsvButton
} from '@src/components/vault/ExportCsvButtons'
import { ImportFromFile } from '@src/components/vault/ImportFromFile'
import React from 'react'
import papaparse from 'papaparse'

const mapCsvToLoginCredentials = (csv: string[][]) => {
  const [header] = csv

  const indexUsername = header.findIndex((x) => x === 'username')
  const indexLabel = header.findIndex((x) => x === 'name')
  const indexPassword = header.findIndex((x) => x === 'password')
  const indexUrl = header.findIndex((x) => x === 'url')

  if (
    indexUsername === -1 ||
    indexLabel === -1 ||
    indexPassword === -1 ||
    indexUrl === -1
  ) {
    return []
  }

  return csv.slice(1).map((row) => ({
    url: row[indexUrl],
    label: row[indexLabel],
    loginCredential: {
      username: row[indexUsername],
      password: row[indexPassword]
    }
  }))
}

export const VaultImportExport: React.FC<{}> = () => {
  const [isCompleted, setIsCompleted] = React.useState(false)
  return (
    <Flex p={5} flexDir={'column'}>
      <Heading size="sm">Import</Heading>
      <Box p={30}>
        {!isCompleted ? (
          <ImportFromFile
            onFileAccepted={(file) => {
              papaparse.parse(file, {
                complete: (results) => {
                  const mapped = mapCsvToLoginCredentials(results.data)
                  // TODO add to device state
                  setIsCompleted(true)
                }
              })

              // console.log('~ parsed', parsed, file)
            }}
          />
        ) : (
          <Button
            m={2}
            onClick={() => {
              setIsCompleted(false)
            }}
          >
            <Trans>Import another</Trans>
          </Button>
        )}
      </Box>

      <Heading size="sm">Export</Heading>

      <ExportLoginCredentialsToCsvButton />
      <br />

      <ExportTOTPToCsvButton />
    </Flex>
  )
}
