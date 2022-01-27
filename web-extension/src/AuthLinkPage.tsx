import { Box } from '@chakra-ui/layout'
import { Center, Heading } from '@chakra-ui/react'
import { Tooltip, IconButton } from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import React, { ReactElement, useContext } from 'react'
import { IoMdArchive } from 'react-icons/io'

export function AuthLinkPage(): ReactElement {
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
                chrome.tabs.create({ url: 'vault.html' })
              }}
            />
          </Tooltip>
        </Center>
      </Box>
    </>
  )
}
