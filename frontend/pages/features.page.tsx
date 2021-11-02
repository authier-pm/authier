import Head from 'next/head'
import React from 'react'
import { AuPage } from '../components/AuPage'
import { Image } from '@chakra-ui/react'
import { t } from '@lingui/macro'
export default function Features() {
  return (
    <>
      <Head>
        <title>Features</title>
      </Head>
      <AuPage heading={t`Features`}>
        <Image src="/assets/Authentication_Two-Color.svg" h="30vh"></Image>
      </AuPage>
    </>
  )
}
