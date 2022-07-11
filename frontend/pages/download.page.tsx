import { Center, Flex, Image, Link, Text } from '@chakra-ui/react'
import { t } from '@lingui/macro'

import { AuPage } from '../components/AuPage'

export default function DownloadPage() {
  return (
    <AuPage heading={t`Downloads`}>
      <Center>
        <Flex flexDirection="column" justifyItems="center">
          <Link href="https://chrome.google.com/webstore/detail/authier/padmmdghcflnaellmmckicifafoenfdi">
            <Image src="https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/YT2Grfi9vEBa2wAPzhWa.png" />
          </Link>

          <Flex backgroundColor="blue.200">
            {/* {test.map((el) => {
                return (
                  <Flex flexDirection="column">
                    <Text>{el.label}</Text>
                    <Text>{el.secret}</Text>
                  </Flex>
                )
              })} */}
          </Flex>
          <Text>Other browsers coming soon</Text>
        </Flex>
      </Center>
    </AuPage>
  )
}
