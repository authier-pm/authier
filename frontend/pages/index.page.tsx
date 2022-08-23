import { ReactNode } from 'react'

import Head from 'next/head'
import { Box, useColorModeValue } from '@chakra-ui/react'

import NextLink from 'next/link'
import { useRouter } from 'next/router'
import Success from '../components/Success'
import Error from '../components/Error'
import Testimonials from '../components/Testimonials'

import AboutSection from '../components/AboutSection'
import Benefits from '../components/Benefits'
import Hero from '../components/Hero'
export const Links = [
  'Features',
  'Pricing',
  'Blog',
  'Download',
  'FAQ',
  'Privacy policy'
]

export const NavLink = ({
  children,
  href
}: {
  children: ReactNode
  href: string
}) => (
  <Box
    px={2}
    py={1}
    rounded={'md'}
    _hover={{
      textDecoration: 'none',
      bg: useColorModeValue('teal.100', 'teal.900')
    }}
  >
    <NextLink href={href}>{children}</NextLink>
  </Box>
)

export default function Home() {
  const router = useRouter()
  const { success, canceled, error } = router.query

  if (success) {
    return <Success />
  } else if (canceled || error) {
    return <Error />
  }

  return (
    <Box>
      <Head>
        <title>Authier</title>
      </Head>
      <Hero />
      <AboutSection />
      <Benefits />
      <Testimonials />
    </Box>
  )
}
