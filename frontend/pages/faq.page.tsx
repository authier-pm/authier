import { Box, Heading } from '@chakra-ui/react'
import { t } from '@lingui/macro'
import Head from 'next/head'
import React from 'react'
import { AuPage } from '../components/AuPage'

export default function FaqPage() {
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
            <Heading size="xs">
              Is it safe to keep both 2FA and login passwords in the same app?
            </Heading>
            <br />
            We believe so. Even if our infrastructure is compromised and
            attacker gains absolute control of our API servers they have no way
            to sniff out a master password for anyone. Master password is kept
            only locally on your devices. Any new device which wants to sync the
            vault will need approval from the master device. So even if the
            attacker gets your master password through phishing or keylogger in
            your system, authier will not let them sync any new device.
          </li>

          <li>
            <Heading size="xs">What encryption is used?</Heading>
            <br />
            Authier encrypts your secrets with AES-256 encryption. They are
            never sent unencrypted anywhere.
          </li>

          <li>
            <Heading size="xs">
              When I need to change the password do I need to change it manually
              on all of the devices?
            </Heading>
            <br />
            Yes. We are planning to introduce a synchronization feature for
            changing password for all devices in the future, but for now
            manually is the only way.
          </li>
        </ul>
      </Box>
    </AuPage>
  )
}
