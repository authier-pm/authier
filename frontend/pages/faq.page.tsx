import { Box, Heading } from '@chakra-ui/react'
import { t } from '@lingui/macro'
import Head from 'next/head'
import React from 'react'
import { AuPage } from '../components/AuPage'

export default function Pricing() {
  return (
    <AuPage heading={t`Frequently asked questions`}>
      <Box m={5}>
        <Head>
          <title>Authier - FAQ</title>
        </Head>

        <ul>
          <li>
            <Heading size="xs">
              Doesn't it defeat the purpose of 2FA when you have codes available
              on the same device?
            </Heading>
            <br />
            No not really. Projects like Authy already allow this for number of
            years. We go further than them to ensure user's security. We lock
            your codes whenever user wishes-so for a security minded
            configuration of Authier you are still required to use your mobile
            phone. Even when you have browser extension installed. Browser
            extension just takes care of the typing for you once you use
            biometrics to unlock your vault.
          </li>
          <li>
            <Heading size="xs">What encryption is used?</Heading>
            <br />
            We encrypt your secrets with AES-256 encryption. We never send them
            unencrypted anywhere.
          </li>
          <li>
            <Heading size="xs">Is it safe to keep both 2FA and login passwords in the same server?</Heading>
            <br />
            Yes. Even if our infrastructure is compromised any new device which wants to sync the vault will need approval from the master device. So even if the attacker gets your master password, without the master device they cannot access your secrets.
          </li>
        </ul>
      </Box>
    </AuPage>
  )
}
