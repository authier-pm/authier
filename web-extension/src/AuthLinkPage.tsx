import { Box, Center, Heading } from '@chakra-ui/react'
import { Tooltip, IconButton } from '@chakra-ui/react'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { IoMdArchive } from 'react-icons/io'
import browser from 'webextension-polyfill'

export function openVaultTab(afterHash = '') {
  //WARNING: In firefox, the path does not need js/ but in chrome it does
  const isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1

  browser.tabs.create({
    url: isChrome ? `js/vault.html#${afterHash}` : `vault.html#${afterHash}`
  })
}

export function AuthLinkPage() {
  return (
    <>
      <Box width="315px" p={30}>
        <Center>
          <Heading size="sm">
            <Trans>Open vault to login or sign up</Trans>
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
