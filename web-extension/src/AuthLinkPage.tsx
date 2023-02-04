import { Box } from '@chakra-ui/layout'
import { Center, Heading } from '@chakra-ui/react'
import { Tooltip, IconButton } from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import React, { ReactElement } from 'react'
import { IoMdArchive } from 'react-icons/io'
import browser from 'webextension-polyfill'

export function openVaultTab(afterHash: string = '') {
  browser.tabs.create({ url: `js/vault.html#${afterHash}` })
}

export function AuthLinkPage(): ReactElement {
  return (
    <>
      <Box width="315px" p={30}>
        <Center>
          <Heading size="sm">
            <Trans>Open vault to login3 or sign up</Trans>
          </Heading>
          <Tooltip label={t`Open vault`} aria-label={t`Open vault`}>
            <IconButton
              size="md"
              ml="2"
              aria-label="menu"
              icon={<IoMdArchive />}
              onClick={async () => {
                openVaultTab()
              }}
            />
          </Tooltip>
        </Center>
      </Box>
    </>
  )
}
