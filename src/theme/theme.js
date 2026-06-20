import { alpha, createTheme } from '@mui/material/styles';

const baseColors = {
  primary: '#3D5CFF',
  primaryDark: '#2E49D1',
  primaryGlow: '#7C8DFF',
  darkBg: '#1F1F39',
  darkSurface: '#161632',
  darkSurfaceAlt: '#18193C',
  lightBg: '#F5F7FA',
  lightSurface: '#FCFDFF',
  lightSurfaceAlt: '#F0F4F8',
  white: '#FFFFFF',
  darkText: '#2D2D4D',

};

const buildTheme = (mode) => {
  const isDark = ['dark', 'lava', 'ocean', 'forest', 'amber', 'dracula', 'amethyst', 'nordic'].includes(mode);
  
  let primaryMain = baseColors.primary;
  let primaryDark = baseColors.primaryDark;
  let primaryLight = baseColors.primaryGlow;
  
  let bgDefault = isDark ? baseColors.darkBg : baseColors.lightBg;
  let bgPaper = isDark ? baseColors.darkSurface : baseColors.lightSurface;
  
  let textPrimary = isDark ? baseColors.white : baseColors.darkText;
  let textSecondary = isDark ? 'rgba(255, 255, 255, 0.72)' : 'rgba(45, 45, 77, 0.7)';
  let textDisabled = isDark ? 'rgba(255, 255, 255, 0.42)' : 'rgba(45, 45, 77, 0.4)';
  
  let dividerColor = isDark ? 'rgba(159, 174, 255, 0.18)' : 'rgba(61, 92, 255, 0.14)';

  if (mode === 'sepia') {
    primaryMain = '#856404';
    primaryDark = '#533f03';
    primaryLight = '#b08b1e';
    bgDefault = '#F4ECD8';
    bgPaper = '#FDF6E3';
    textPrimary = '#5C3E21';
    textSecondary = 'rgba(92, 62, 33, 0.72)';
    textDisabled = 'rgba(92, 62, 33, 0.4)';
    dividerColor = 'rgba(133, 100, 4, 0.18)';
  } else if (mode === 'lava') {
    primaryMain = '#ff4500';
    primaryDark = '#cc3700';
    primaryLight = '#ff7849';
    bgDefault = '#120505';
    bgPaper = '#1c0a0a';
    textPrimary = '#ffc83b';
    textSecondary = 'rgba(255, 200, 59, 0.72)';
    textDisabled = 'rgba(255, 200, 59, 0.4)';
    dividerColor = 'rgba(255, 69, 0, 0.22)';
  } else if (mode === 'ocean') {
    primaryMain = '#00bcd4';
    primaryDark = '#0097a7';
    primaryLight = '#4dd0e1';
    bgDefault = '#0a192f';
    bgPaper = '#0f3057';
    textPrimary = '#e0f7fa';
    textSecondary = 'rgba(224, 247, 250, 0.72)';
    textDisabled = 'rgba(224, 247, 250, 0.4)';
    dividerColor = 'rgba(0, 188, 212, 0.18)';
  } else if (mode === 'forest') {
    primaryMain = '#10b981';
    primaryDark = '#047857';
    primaryLight = '#34d399';
    bgDefault = '#091a10';
    bgPaper = '#0c2617';
    textPrimary = '#e2f3eb';
    textSecondary = 'rgba(226, 243, 235, 0.72)';
    textDisabled = 'rgba(226, 243, 235, 0.4)';
    dividerColor = 'rgba(16, 185, 129, 0.18)';
  } else if (mode === 'amber') {
    primaryMain = '#b58900';
    primaryDark = '#936c00';
    primaryLight = '#cb9b10';
    bgDefault = '#073642';
    bgPaper = '#002b36';
    textPrimary = '#fdf6e3';
    textSecondary = 'rgba(253, 246, 227, 0.72)';
    textDisabled = 'rgba(253, 246, 227, 0.4)';
    dividerColor = 'rgba(181, 137, 0, 0.18)';
  } else if (mode === 'dracula') {
    primaryMain = '#ff79c6';
    primaryDark = '#e25ca6';
    primaryLight = '#ff92df';
    bgDefault = '#282a36';
    bgPaper = '#1e1f29';
    textPrimary = '#f8f8f2';
    textSecondary = 'rgba(248, 248, 242, 0.72)';
    textDisabled = 'rgba(248, 248, 242, 0.4)';
    dividerColor = 'rgba(255, 121, 198, 0.18)';
  } else if (mode === 'amethyst') {
    primaryMain = '#d4af37';
    primaryDark = '#aa8920';
    primaryLight = '#e5c158';
    bgDefault = '#1c0c28';
    bgPaper = '#29153a';
    textPrimary = '#fae8ff';
    textSecondary = 'rgba(250, 232, 255, 0.72)';
    textDisabled = 'rgba(250, 232, 255, 0.4)';
    dividerColor = 'rgba(212, 175, 55, 0.18)';
  } else if (mode === 'nordic') {
    primaryMain = '#88c0d0';
    primaryDark = '#5e81ac';
    primaryLight = '#8fbcbb';
    bgDefault = '#2e3440';
    bgPaper = '#3b4252';
    textPrimary = '#eceff4';
    textSecondary = 'rgba(236, 239, 244, 0.72)';
    textDisabled = 'rgba(236, 239, 244, 0.4)';
    dividerColor = 'rgba(136, 192, 208, 0.18)';
  }

  const palette = {
    mode: isDark ? 'dark' : 'light',
    primary: {
      main: primaryMain,
      dark: primaryDark,
      light: primaryLight,
      contrastText: baseColors.white,
    },
    secondary: {
      main: isDark ? baseColors.darkSurfaceAlt : baseColors.lightSurfaceAlt,
    },
    success: {
      main: '#3DDC97',
    },
    warning: {
      main: '#FFB547',
    },
    error: {
      main: '#FF647C',
    },
    background: {
      default: bgDefault,
      paper: bgPaper,
    },
    text: {
      primary: textPrimary,
      secondary: textSecondary,
      disabled: textDisabled,
    },
    divider: dividerColor,
  };

  return createTheme({
    palette,
    shape: {
      borderRadius: 20,
    },
    typography: {
      fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.04em' },
      h2: { fontWeight: 800, letterSpacing: '-0.035em' },
      h3: { fontWeight: 800, letterSpacing: '-0.03em' },
      h4: { fontWeight: 700, letterSpacing: '-0.025em' },
      h5: { fontWeight: 700, letterSpacing: '-0.02em' },
      h6: { fontWeight: 700, letterSpacing: '-0.015em' },
      button: {
        fontWeight: 700,
        letterSpacing: '0.02em',
        textTransform: 'none',
      },
    },
    shadows: [
      'none',
      '0 1px 2px rgba(8, 10, 27, 0.06)',
      '0 2px 6px rgba(8, 10, 27, 0.08)',
      '0 4px 12px rgba(8, 10, 27, 0.10)',
      '0 8px 20px rgba(8, 10, 27, 0.12)',
      '0 12px 28px rgba(8, 10, 27, 0.16)',
      '0 16px 40px rgba(8, 10, 27, 0.20)',
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: bgDefault,
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 16,
            backgroundColor: bgPaper,
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 18,
            paddingInline: 22,
            transition: 'all 0.2s ease',
          },
          containedPrimary: {
            backgroundColor: primaryMain,
            boxShadow: '0 2px 6px rgba(8, 10, 27, 0.12)',
            '&:hover': {
              backgroundColor: primaryDark,
              boxShadow: '0 4px 10px rgba(8, 10, 27, 0.16)',
            },
            '&:active': {
              boxShadow: '0 2px 4px rgba(8, 10, 27, 0.12)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
            fontWeight: 600,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? alpha(bgPaper, 0.94) : alpha(bgPaper, 0.92),
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
        },
      },
    },
  });
};

export const darkTheme = buildTheme('dark');
export const lightTheme = buildTheme('light');
export { buildTheme };
