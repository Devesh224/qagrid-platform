import { createTheme } from '@mui/material/styles';

export function makeTheme(mode: 'light' | 'dark') {
  return createTheme({
    palette: {
      mode,
      primary: { main: mode === 'light' ? '#173d70' : '#88b8ff' },
      secondary: { main: '#0e7490' },
      background: mode === 'light'
        ? { default: '#f3f6fa', paper: '#ffffff' }
        : { default: '#0e1727', paper: '#172235' },
      success: { main: '#16845a' },
      warning: { main: '#af6b16' },
      error: { main: '#c43d4b' },
    },
    typography: {
      fontFamily: '"Segoe UI", Inter, system-ui, sans-serif',
      h4: { fontWeight: 750, letterSpacing: '-0.03em' },
      h5: { fontWeight: 700, letterSpacing: '-0.02em' },
      h6: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 650 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCard: {
        styleOverrides: {
          root: { border: '1px solid', borderColor: mode === 'light' ? '#e1e7ef' : '#314154',
            boxShadow: mode === 'light' ? '0 4px 24px rgba(27, 49, 75, 0.04)' : 'none' },
        },
      },
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiTableCell: { styleOverrides: { head: { fontWeight: 700 } } },
    },
  });
}
