import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f5b4f',
      dark: '#0a453c',
      light: '#dcefe9',
    },
    secondary: {
      main: '#ea6a1f',
      light: '#f9e2d2',
    },
    background: {
      default: '#f3f5f1',
      paper: '#ffffff',
    },
    success: {
      main: '#20754a',
    },
    warning: {
      main: '#c17b18',
    },
    error: {
      main: '#b42318',
    },
    divider: '#dbe1d7',
    text: {
      primary: '#15221d',
      secondary: '#55635c',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Public Sans", "Segoe UI", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            'linear-gradient(180deg, #edf2ec 0%, #f7f8f5 18%, #f3f5f1 100%)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #dbe1d7',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#f7f8f4',
          color: '#15221d',
          boxShadow: 'none',
          borderBottom: '1px solid #dbe1d7',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #dbe1d7',
          backgroundColor: '#f7f8f4',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingInline: 14,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderRadius: 8,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 7,
          fontWeight: 600,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#f8faf7',
          color: '#55635c',
          fontWeight: 600,
        },
      },
    },
  },
});
