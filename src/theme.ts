import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

// Color mode configuration
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
}

// Custom theme colors and components
const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: '#e6f2ff',
      100: '#bddaff',
      200: '#94c2ff',
      300: '#6aa9ff',
      400: '#4191ff',
      500: '#1778ff', // Primary brand color
      600: '#0e60db',
      700: '#0749b8',
      800: '#023595',
      900: '#001f72',
    },
    success: {
      500: '#38A169', // Green for positive indicators
    },
    warning: {
      500: '#F6AD55', // Orange for neutral indicators
    },
    danger: {
      500: '#E53E3E', // Red for negative indicators
    },
  },
  fonts: {
    heading: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    body: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'medium',
        borderRadius: 'md',
      },
      variants: {
        solid: (props: { colorScheme: string }) => ({
          bg: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
          color: 'white',
          _hover: {
            bg: props.colorScheme === 'brand' ? 'brand.600' : `${props.colorScheme}.600`,
          },
        }),
      },
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: 'lg',
          overflow: 'hidden',
          boxShadow: 'md',
        },
      },
    },
    Table: {
      variants: {
        simple: {
          th: {
            fontWeight: 'semibold',
            textTransform: 'capitalize',
            letterSpacing: 'wider',
            borderBottom: '1px',
            borderColor: 'gray.200',
          },
          td: {
            borderBottom: '1px',
            borderColor: 'gray.200',
          },
        },
      },
    },
  },
  styles: {
    global: (props: { colorMode: string }) => ({
      body: {
        bg: props.colorMode === 'light' ? 'gray.50' : 'gray.800',
        color: props.colorMode === 'light' ? 'gray.800' : 'gray.100',
      },
      // Ensure proper text color contrast in both modes
      ".chakra-text": {
        color: props.colorMode === 'light' ? 'gray.800' : 'white',
      },
      // Fix headers in light mode
      "h1, h2, h3, h4, h5, h6": {
        color: props.colorMode === 'light' ? 'gray.900' : 'white',
      },
      // Fix badge color contrast
      ".chakra-badge": {
        color: props.colorMode === 'light' ? 'inherit' : 'white',
      },
      // Fix table text in light mode
      "th, td": {
        color: props.colorMode === 'light' ? 'gray.700' : 'gray.100',
      },
      // Fix input text color
      "input, select, textarea": {
        color: props.colorMode === 'light' ? 'gray.800' : 'white',
      },
      // Add transition for smooth theme switching
      "*, *::before, *::after": {
        transition: "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease",
      },
      // Fix tooltip text in light mode
      ".chakra-tooltip": {
        color: props.colorMode === 'light' ? 'white' : 'gray.800',
      },
      // Add global fadeIn animation
      "@keyframes fadeIn": {
        "0%": { opacity: 0, transform: "translateY(10px)" },
        "100%": { opacity: 1, transform: "translateY(0)" }
      },
    }),
  },
})

export default theme