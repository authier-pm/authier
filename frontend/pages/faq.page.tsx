import { Box, Heading } from '@chakra-ui/react'
import { t } from '@lingui/macro'
import Head from 'next/head'
import { AuPage } from '../components/AuPage'

export default function FaqPage() {
  return (
    <AuPage heading={t`Frequently asked questions`}>
      <Box minH="80vh" m={5}>
        <Head>
          <title>Authier - FAQ</title>
        </Head>

        <ul>
          <li>
            <Heading size="m">
              Doesn't it defeat the purpose of 2FA when you have codes available
              on the same device?
            </Heading>
            No not really. Projects like Authy already do this for number of
            years. We go further than them to ensure user's security. We lock
            your codes-so for a security minded configuration of Authier you are
            still required to use your mobile phone. Even when you have browser
            extension installed. Browser extension just takes care of the silly
            keyboard typing for you once you use biometrics to unlock your
            vault.
          </li>
          <br />
          <li>
            <Heading size="m">
              Is it safe to keep both 2FA and login passwords in the same app?
            </Heading>
            We believe so. Even if our infrastructure is compromised and
            attacker gains absolute control of our API servers they have no way
            to sniff out a master password for anyone. Master password is kept
            only locally on your devices. In addition any new device which wants
            to sync the vault will need approval from the master device. So even
            if the attacker gets your master password through phishing or key
            logger in your system, authier will not let them sync any new
            device.
          </li>
          <br />

          <li>
            <Heading size="m">What encryption is used?</Heading>
            Authier encrypts your secrets with AES-256 encryption. They are
            never sent unencrypted anywhere.
          </li>
          <br />

          <li>
            <Heading size="m">
              When I need to change the password do I need to change it manually
              on all of the devices?
            </Heading>
            Yes. We are planning to introduce a synchronization feature for
            changing password for all devices in the future, but for now
            manually is the only way.
          </li>
          <br />

          <li>
            <Heading size="m">
              When I add a new password and user name on a website, can I
              opt-out from storing the public record about the login form on
              that particular page?
            </Heading>
            Not right now, but we plan to add this feature in the future.
          </li>
        </ul>
      </Box>
    </AuPage>
  )
}
