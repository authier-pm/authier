import { Button, Flex, Heading } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import {
  ExportLoginCredentialsToCsvButton,
  ExportTOTPToCsvButton
} from '@src/components/vault/ExportCsvButtons'
import React from 'react'

export const VaultImportExport: React.FC<{}> = () => {
  return (
    <Flex p={5} flexDir={'column'}>
      <Heading size="sm">Import</Heading>
      <Button
        m={2}
        onClick={() => {
          alert('Not implemented')
        }}
      >
        <Trans>Parse and add secrets</Trans>
      </Button>
      <Heading size="sm">Export</Heading>

      <ExportLoginCredentialsToCsvButton />
      <br />

      <ExportTOTPToCsvButton />
    </Flex>
  )
}
