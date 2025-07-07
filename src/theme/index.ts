import { createTheme, ThemeOptions, useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { Components } from '@mui/material/styles/components';

// Define color palette
const colors = {
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#dc004e',
    light: '#ff5983',
    dark: '#9a0036',
    contrastText: '#ffffff',
  },
  background: {
    default: '#fafafa',
    paper: '#ffffff',
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
  success: {
    main: '#4caf50',
    light: '#81c784',
    dark: '#388e3c',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#ff9800',
    light: '#ffb74d',
    dark: '#f57c00',
    contrastText: '#ffffff',
  },
  error: {
    main: '#f44336',
    light: '#e57373',
    dark: '#d32f2f',
    contrastText: '#ffffff',
  },
  info: {
    main: '#2196f3',
    light: '#64b5f6',
    dark: '#1976d2',
    contrastText: '#ffffff',
  },
  // Custom colors for Quranic app
  tajweed: {
    correct: '#4caf50',
    incorrect: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
  },
  audio: {
    recording: '#f44336',
    playing: '#4caf50',
    paused: '#ff9800',
    stopped: '#757575',
  },
} as const;

// Typography configuration
const typography = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 300,
    lineHeight: 1.2,
    letterSpacing: '-0.01562em',
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 300,
    lineHeight: 1.2,
    letterSpacing: '-0.00833em',
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 400,
    lineHeight: 1.167,
    letterSpacing: '0em',
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 400,
    lineHeight: 1.235,
    letterSpacing: '0.00735em',
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 400,
    lineHeight: 1.334,
    letterSpacing: '0em',
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.6,
    letterSpacing: '0.0075em',
  },
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.75,
    letterSpacing: '0.00938em',
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.57,
    letterSpacing: '0.00714em',
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.00938em',
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.43,
    letterSpacing: '0.01071em',
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.66,
    letterSpacing: '0.03333em',
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 2.66,
    letterSpacing: '0.08333em',
    textTransform: 'uppercase' as const,
  },
};

// Breakpoints configuration
const breakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  },
};

// Component overrides
const components: Components = {
  MuiButton: {
    styleOverrides: {
      root: {
        minHeight: 44, // Touch target size
        minWidth: 44,
        borderRadius: 8,
        textTransform: 'none',
        fontWeight: 500,
      },
      sizeSmall: {
        minHeight: 36,
        minWidth: 36,
        padding: '6px 12px',
      },
      sizeLarge: {
        minHeight: 52,
        minWidth: 52,
        padding: '12px 24px',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
        '&:hover': {
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.15)',
        },
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        '&:last-child': {
          paddingBottom: 16,
        },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          minHeight: 44,
        },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        minHeight: 44,
        minWidth: 44,
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
      elevation1: {
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  MuiSlider: {
    styleOverrides: {
      root: {
        height: 8,
        '& .MuiSlider-track': {
          height: 8,
          border: 'none',
          borderRadius: 4,
        },
        '& .MuiSlider-rail': {
          height: 8,
          borderRadius: 4,
          opacity: 0.3,
        },
        '& .MuiSlider-thumb': {
          height: 20,
          width: 20,
          backgroundColor: '#fff',
          border: '2px solid currentColor',
          '&:hover': {
            boxShadow: '0px 0px 0px 8px rgba(25, 118, 210, 0.16)',
          },
        },
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        height: 8,
        borderRadius: 4,
      },
      bar: {
        borderRadius: 4,
      },
    },
  },
};

// Base theme configuration
const baseTheme: ThemeOptions = {
  palette: {
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    text: colors.text,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
  },
  typography,
  breakpoints,
  components,
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
};

// Create theme
export const theme = createTheme(baseTheme);

// Dark theme
export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
      light: '#bbdefb',
      dark: '#42a5f5',
      contrastText: '#000000',
    },
    secondary: {
      main: '#f48fb1',
      light: '#f8bbd9',
      dark: '#f06292',
      contrastText: '#000000',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.5)',
    },
    success: {
      main: '#66bb6a',
      light: '#81c784',
      dark: '#4caf50',
      contrastText: '#000000',
    },
    warning: {
      main: '#ffa726',
      light: '#ffb74d',
      dark: '#ff9800',
      contrastText: '#000000',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
      contrastText: '#ffffff',
    },
    info: {
      main: '#29b6f6',
      light: '#4fc3f7',
      dark: '#0288d1',
      contrastText: '#000000',
    },
  },
});

// Responsive design utilities
export const useResponsive = () => {
  const theme = useTheme();
  
  return {
    isMobile: useMediaQuery(theme.breakpoints.down('sm')),
    isTablet: useMediaQuery(theme.breakpoints.between('sm', 'md')),
    isDesktop: useMediaQuery(theme.breakpoints.up('lg')),
    isXLarge: useMediaQuery(theme.breakpoints.up('xl')),
  };
};

// Custom theme extensions
declare module '@mui/material/styles' {
  interface Palette {
    tajweed: {
      correct: string;
      incorrect: string;
      warning: string;
      info: string;
    };
    audio: {
      recording: string;
      playing: string;
      paused: string;
      stopped: string;
    };
  }

  interface PaletteOptions {
    tajweed?: {
      correct?: string;
      incorrect?: string;
      warning?: string;
      info?: string;
    };
    audio?: {
      recording?: string;
      playing?: string;
      paused?: string;
      stopped?: string;
    };
  }
}

// Export theme colors for use in components
export { colors };

// Export default theme
export default theme;