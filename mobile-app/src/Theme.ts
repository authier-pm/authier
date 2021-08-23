import { extendTheme } from 'native-base';

export const theme = extendTheme({
  colors: {
    // Add new color
    primary: {
      50: '#84CAE7',
      100: '#68D5DD',
      200: '#5ADBD8',
      300: '#4CE0D2',
      400: '#37C5BA',
      500: '#22AAA1',
      600: '#1B8D82',
      700: '#136F63',
      800: '#0C453C',
      900: '#041B15',
    },
  },
  config: {
    // Changing initialColorMode to 'dark'
    initialColorMode: 'light',
  },
});
