import Head from 'next/head'
import React from 'react'
import { PageHeading } from '../components/PageHeading'
import { Image } from '@chakra-ui/react'
export default function Features() {
  return (
    <>
      <Head>
        <title>Features</title>
      </Head>
      <PageHeading>Features</PageHeading>
      <Image src="/assets/Authentication_Two-Color.svg" h="50vh"></Image>
    </>
  )
}
