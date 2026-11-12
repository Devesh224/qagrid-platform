import { createContext, lazy, Suspense, useContext, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Box, CircularProgress, CssBaseline, ThemeProvider } from '@mui/material';
import { AppLayout } from '../components/AppLayout';
import { makeTheme } from '../theme/theme';
const OverviewPage = lazy(() => import('../pages/OverviewPage').then((module) => ({ default: module.OverviewPage })));
const EnvironmentsPage = lazy(() => import('../pages/EnvironmentsPage').then((module) => ({ default: module.EnvironmentsPage })));
const ReservationsPage = lazy(() => import('../pages/ReservationsPage').then((module) => ({ default: module.ReservationsPage })));
const HealthPage = lazy(() => import('../pages/HealthPage').then((module) => ({ default: module.HealthPage })));
const ApiDocsPage = lazy(() => import('../pages/ApiDocsPage').then((module) => ({ default: module.ApiDocsPage })));
const SettingsPage = lazy(() => import('../pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));

type ColorMode = 'light' | 'dark';
const ColorModeContext = createContext({ mode: 'light' as ColorMode, setMode: (_mode: ColorMode) => {} });
export const useColorMode = () => useContext(ColorModeContext);

export function App() {
  const [mode, setMode] = useState<ColorMode>(() => localStorage.getItem('qagrid-theme') === 'dark' ? 'dark' : 'light');
  const theme = useMemo(() => makeTheme(mode), [mode]);
  const changeMode = (next: ColorMode) => { localStorage.setItem('qagrid-theme', next); setMode(next); };
  return (
    <ColorModeContext.Provider value={{ mode, setMode: changeMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Suspense fallback={<Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress aria-label="Loading page" /></Box>}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="environments" element={<EnvironmentsPage />} />
              <Route path="reservations" element={<ReservationsPage />} />
              <Route path="health" element={<HealthPage />} />
              <Route path="api-docs" element={<ApiDocsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
