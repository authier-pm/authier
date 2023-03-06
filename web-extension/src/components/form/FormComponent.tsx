import { motion } from 'framer-motion'
import { Button, VStack, Box, useColorModeValue } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'

export default function FormComponent({
  children,
  onSubmit
}: {
  children: ReactNode
  onSubmit: () => void
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
      style={{
        display: 'contents'
      }}
    >
      <VStack
        width={'70%'}
        maxW="600px"
        alignItems={'normal'}
        spacing={20}
        rounded={'lg'}
        boxShadow={'lg'}
        p={30}
        bg={useColorModeValue('white', 'gray.800')}
      >
        <Box textAlign="start">
          <form onSubmit={onSubmit}>
            <VStack spacing={4} align="flex-start">
              {children}
              <Button
                mt={4}
                colorScheme="teal"
                type="submit"
                onSubmit={onSubmit}
              >
                <Trans>Save</Trans>
              </Button>
            </VStack>
          </form>
        </Box>
      </VStack>
    </motion.div>
  )
}
