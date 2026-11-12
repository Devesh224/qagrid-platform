import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { PageHeader } from '../components/PageHeader';
import { useColorMode } from '../app/App';
import { defaultConfig, getApiConfig, resetApiConfig, saveApiConfig } from '../services/api/config';
import type { ApiConfig } from '../services/api/config';

function validBrowserAddress(value: string): boolean {
  if (value.startsWith('/')) return !value.startsWith('//');
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function SettingsPage() {
  const { mode, setMode } = useColorMode();
  const [config, setConfig] = useState<ApiConfig>(getApiConfig);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const update = (key: keyof ApiConfig, value: string) => setConfig((current) => ({ ...current, [key]: value }));

  function save() {
    if (Object.values(config).some((value) => !validBrowserAddress(value.trim()))) {
      setError('Enter a relative path or a browser-accessible HTTP(S) URL without embedded credentials.');
      setSaved(false);
      return;
    }
    saveApiConfig(Object.fromEntries(Object.entries(config).map(([key, value]) => [key, value.trim().replace(/\/$/, '')])) as unknown as ApiConfig);
    setError(''); setSaved(true);
  }
  function reset() {
    resetApiConfig(); setConfig(defaultConfig); setError(''); setSaved(true);
  }

  return <>
    <PageHeader title="Settings" subtitle="Display preferences and browser API connections" />
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.5fr' }, gap: 2 }}>
      <Card><CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Appearance</Typography>
        <FormControl fullWidth><InputLabel>Theme</InputLabel>
          <Select label="Theme" value={mode} onChange={(event) => setMode(event.target.value as 'light' | 'dark')}>
            <MenuItem value="light">Light</MenuItem><MenuItem value="dark">Dark</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          QAGrid Dashboard version 1.0.0. This interface manages environments and reservations through two independent services.
        </Typography>
      </CardContent></Card>
      <Card><CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 0.5 }}>API connections</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Relative /registry and /scheduler paths use the same-origin proxy. Absolute URLs must be reachable by your browser and may require CORS.
          No database credentials belong here.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {saved && <Alert severity="success" sx={{ mb: 2 }}>Settings saved. Reload this page to refresh data with the new paths.</Alert>}
        <Stack spacing={2}>
          <TextField label="Registry API path" value={config.registryBase} onChange={(event) => update('registryBase', event.target.value)} />
          <TextField label="Scheduler API path" value={config.schedulerBase} onChange={(event) => update('schedulerBase', event.target.value)} />
          <TextField label="Registry Swagger URL" value={config.registryDocs} onChange={(event) => update('registryDocs', event.target.value)} />
          <TextField label="Scheduler Swagger URL" value={config.schedulerDocs} onChange={(event) => update('schedulerDocs', event.target.value)} />
          <Box sx={{ display: 'flex', gap: 1 }}><Button variant="contained" onClick={save}>Save connections</Button>
            <Button onClick={reset}>Restore defaults</Button></Box>
        </Stack>
      </CardContent></Card>
    </Box>
  </>;
}
