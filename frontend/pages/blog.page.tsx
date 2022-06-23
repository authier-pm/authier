import { Box } from '@chakra-ui/react'

import Head from 'next/head'
import React from 'react'
import { AuPage } from '../components/AuPage'
import { AuthierMarkdown } from './AuthierMarkdown'
import launch from './blogposts/launch.md'

const posts = [launch]

export default function BlogPage() {
  return (
    <Box>
      <Head>
        <title>Authier - Blog</title>
      </Head>
      <AuPage heading={'Recent posts'}>
        <Box m={3} p={3}>
          {posts.map((md, i) => {
            return <AuthierMarkdown md={md} key={i}></AuthierMarkdown>
          })}
        </Box>
      </AuPage>
    </Box>
  )
}
