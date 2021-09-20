import { extendTheme } from '@chakra-ui/react'

// 2. Extend the theme to include custom colors, fonts, etc
const colors = {
  brand: {
    100: '#F0C645',
    200: '#FFC045',
    300: '#FC045A',
    800: '#0F01AB',
    700: '#0691AB'
  },
  gray: {
    '50': '#F0F4F4',
    '100': '#D6E0E0',
    '200': '#BCCDCD',
    '300': '#A2B9B9',
    '400': '#88A5A5',
    '500': '#6D9292',
    '600': '#577575',
    '700': '#425757',
    '800': '#2C3A3A',
    '900': '#161D1D'
  },
  green: {
    '50': '#E9FBF9',
    '100': '#C2F5EE',
    '200': '#9BEEE3',
    '300': '#74E7D8',
    '400': '#4CE0CD',
    '500': '#25DAC2',
    '600': '#1EAE9B',
    '700': '#168375',
    '800': '#0F574E',
    '900': '#072C27'
  },
  teal: {
    '50': '#EAFBFB',
    '100': '#C3F3F3',
    '200': '#9DECEB',
    '300': '#77E4E3',
    '400': '#50DDDC',
    '500': '#2AD5D4',
    '600': '#21ABA9',
    '700': '#19807F',
    '800': '#115555',
    '900': '#082B2A'
  },
  cyan: {
    '50': '#E5FBFF',
    '100': '#B8F4FF',
    '200': '#8AEEFF',
    '300': '#5CE7FF',
    '400': '#2EE0FF',
    '500': '#00D9FF',
    '600': '#3FC1C9',
    '700': '#008299',
    '800': '#005766',
    '900': '#002B33'
  }
}
export const chakraCustomTheme = extendTheme({
  colors,
  initialColorMode: 'light',
  useSystemColorMode: false
})
