import type { Colors, ThemeOverride } from '@chakra-ui/react'

// 2. Extend the theme to include custom colors, fonts, etc
export const authierColors: Colors = {
  brand: {
    100: '#F0C645',
    200: '#FFC045',
    300: '#FC045A',
    700: '#0691AB',
    800: '#0F01AB'
  },
  orange: {
    '50': '#FFF6E5',
    '100': '#FFE7B8',
    '200': '#FFD78A',
    '300': '#FFC85C',
    '400': '#FFB82E',
    '500': '#FFA900',
    '600': '#CC8700',
    '700': '#996500',
    '800': '#664300',
    '900': '#332200'
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
export const chakraRawTheme: ThemeOverride = {
  colors: authierColors,
  config: {
    initialColorMode: 'dark'
  },
  styles: {
    global: {
      '*': {
        minWidth: 0,
        boxSizing: 'border-box'
      }
    }
  },
  components: {
    Button: {
      baseStyle: {
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        overflow: 'hidden'
      }
    }
  }
}

// brand: {
//   50: '#84CAE7',
//   100: '#68D5DD',
//   200: '#5ADBD8',
//   300: '#4CE0D2',
//   400: '#37C5BA',
//   500: '#22AAA1',
//   600: '#1B8D82',
//   700: '#136F63',
//   800: '#0C453C',
//   900: '#041B15'
// }
