import { extendTheme } from '@chakra-ui/react'
import { chakraRawTheme } from '../../shared/chakraRawTheme'

// need to do this here, because calling it inside shared folder fails
export const chakraCustomTheme = extendTheme(chakraRawTheme)
