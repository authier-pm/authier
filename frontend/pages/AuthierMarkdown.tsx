import React from 'react'
import ReactMarkdown from 'react-markdown'
import ChakraUIRenderer from 'chakra-ui-markdown-renderer'
import remarkGfm from 'remark-gfm'
import { chakraCustomTheme } from '../lib/chakraTheme'

export function AuthierMarkdown(importedMarkdown: { md: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={ChakraUIRenderer(chakraCustomTheme)}
    >
      {importedMarkdown.md}
    </ReactMarkdown>
  )
}
