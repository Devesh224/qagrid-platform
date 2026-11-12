import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Skeleton, Snackbar, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { StatusChip } from '../components/StatusChip';
import { registryApi } from '../services/api/registry';
import { apiErrorMessage } from '../services/api/client';
import { formatDateTime } from '../utils/date';
import type { Environment, EnvironmentCreate, EnvironmentStatus, EnvironmentType, HealthStatus, Page } from '../types/api';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  environment_type: z.enum(['BROWSER', 'MOBILE', 'API']),
  platform: z.string().max(100),
  operating_system: z.string().max(100),
  browser: z.string().max(100),
  browser_version: z.string().max(50),
});
type Values = z.infer<typeof schema>;
const blank: Values = { name: '', environment_type: 'BROWSER', platform: '', operating_system: '', browser: '', browser_version: '' };
const optional = (value: string) => value.trim() || null;

function EnvironmentForm({ open, initial, onClose, onSaved }: { open: boolean; initial: Environment | null; onClose: () => void; onSaved: (message: string) => void }) {
  const { register, control, handleSubmit, reset, setError, formState: { errors } } = useForm<Values>({ defaultValues: blank });
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  useEffect(() => {
    if (open) {
      reset(initial ? {
        name: initial.name, environment_type: initial.environment_type,
        platform: initial.platform || '', operating_system: initial.operating_system || '',
        browser: initial.browser || '', browser_version: initial.browser_version || '',
      } : blank);
      setServerError('');
    }
  }, [open, initial, reset]);

  async function submit(values: Values) {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => setError(issue.path[0] as keyof Values, { message: issue.message }));
      return;
    }
    const input: EnvironmentCreate = {
      name: parsed.data.name, environment_type: parsed.data.environment_type,
      platform: optional(parsed.data.platform), operating_system: optional(parsed.data.operating_system),
      browser: optional(parsed.data.browser), browser_version: optional(parsed.data.browser_version),
    };
    setSaving(true);
    setServerError('');
    try {
      if (initial) await registryApi.update(initial.environment_id, input);
      else await registryApi.create(input);
      onSaved(initial ? 'Environment updated.' : 'Environment registered. Set health to HEALTHY before booking.');
    } catch (error) {
      setServerError(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
    <DialogTitle>{initial ? 'Edit environment' : 'Register environment'}</DialogTitle>
    <Box component="form" onSubmit={handleSubmit(submit)}>
      <DialogContent sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: '12px !important' }}>
        {serverError && <Alert severity="error" sx={{ gridColumn: '1 / -1' }}>{serverError}</Alert>}
        <TextField label="Environment name" {...register('name')} error={!!errors.name} helperText={errors.name?.message} sx={{ gridColumn: '1 / -1' }} required />
        <Controller name="environment_type" control={control} render={({ field }) =>
          <TextField {...field} select label="Type" error={!!errors.environment_type} helperText={errors.environment_type?.message}>
            {(['BROWSER', 'MOBILE', 'API'] as const).map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
          </TextField>} />
        <TextField label="Platform" {...register('platform')} error={!!errors.platform} helperText={errors.platform?.message} />
        <TextField label="Operating system" {...register('operating_system')} error={!!errors.operating_system} helperText={errors.operating_system?.message} />
        <TextField label="Browser" {...register('browser')} error={!!errors.browser} helperText={errors.browser?.message} />
        <TextField label="Browser version" {...register('browser_version')} error={!!errors.browser_version} helperText={errors.browser_version?.message} />
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving…' : initial ? 'Save changes' : 'Register'}</Button>
      </DialogActions>
    </Box>
  </Dialog>;
}

function Detail({ item, onClose }: { item: Environment | null; onClose: () => void }) {
  if (!item) return null;
  const entries = [
    ['ID', item.environment_id], ['Type', item.environment_type], ['Platform', item.platform],
    ['Operating system', item.operating_system], ['Browser', item.browser], ['Browser version', item.browser_version],
    ['Maintenance reason', item.maintenance_reason], ['Maintenance ends', formatDateTime(item.maintenance_ends_at)],
    ['Created', formatDateTime(item.created_at)], ['Updated', formatDateTime(item.updated_at)],
  ];
  return <Dialog open onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>{item.name}</DialogTitle>
    <DialogContent>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}><StatusChip value={item.status} /><StatusChip value={item.health_status} /></Stack>
      <Stack spacing={1.5}>{entries.map(([label, value]) => <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="body2" sx={{ textAlign: 'right', overflowWrap: 'anywhere' }}>{value || '—'}</Typography>
      </Box>)}</Stack>
    </DialogContent>
    <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
  </Dialog>;
}

export function EnvironmentsPage() {
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<EnvironmentStatus | ''>('');
  const [health, setHealth] = useState<HealthStatus | ''>('');
  const [type, setType] = useState<EnvironmentType | ''>('');
  const [data, setData] = useState<Page<Environment> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Environment | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<Environment | null>(null);
  const [stateItem, setStateItem] = useState<Environment | null>(null);
  const [nextStatus, setNextStatus] = useState<EnvironmentStatus>('ACTIVE');
  const [maintenanceReason, setMaintenanceReason] = useState('');
  const [healthItem, setHealthItem] = useState<Environment | null>(null);
  const [nextHealth, setNextHealth] = useState<HealthStatus>('UNKNOWN');
  const [actionBusy, setActionBusy] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await registryApi.list({ name: search || undefined, status: status || undefined,
        health_status: health || undefined, environment_type: type || undefined, limit: 10, offset: page * 10 }));
    } catch (failure) {
      setData(null);
      setError(apiErrorMessage(failure));
    } finally {
      setLoading(false);
    }
  }, [search, status, health, type, page]);
  useEffect(() => { void load(); }, [load]);

  function saved(message: string) {
    setFormOpen(false); setEditing(null); setToast(message); void load();
  }
  async function saveStatus() {
    if (!stateItem) return;
    if (nextStatus === 'UNDER_MAINTENANCE' && !maintenanceReason.trim()) {
      setError('Maintenance reason is required.'); return;
    }
    setActionBusy(true); setError('');
    try {
      await registryApi.changeStatus(stateItem.environment_id, nextStatus,
        nextStatus === 'UNDER_MAINTENANCE' ? maintenanceReason.trim() : undefined);
      setStateItem(null); setToast('Environment status updated.'); await load();
    } catch (failure) { setError(apiErrorMessage(failure)); }
    finally { setActionBusy(false); }
  }
  async function saveHealth() {
    if (!healthItem) return;
    setActionBusy(true); setError('');
    try {
      await registryApi.changeHealth(healthItem.environment_id, nextHealth);
      setHealthItem(null); setToast('Health status updated.'); await load();
    } catch (failure) { setError(apiErrorMessage(failure)); }
    finally { setActionBusy(false); }
  }

  return <>
    <PageHeader title="Environments" subtitle="Register, find and maintain QA infrastructure"
      action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setFormOpen(true); }}>Register environment</Button>} />
    {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
    <Card sx={{ minWidth: 0 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'minmax(230px, 1fr) repeat(3, 145px) auto' }, gap: 1.5, mb: 2 }}>
          <Box component="form" onSubmit={(event) => { event.preventDefault(); setPage(0); setSearch(searchInput.trim()); }} sx={{ display: 'flex', gap: 1, minWidth: 0 }}>
            <TextField size="small" label="Search by name" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} fullWidth />
            <Button type="submit" variant="outlined" aria-label="Search"><SearchIcon /></Button>
          </Box>
          <FormControl size="small" sx={{ minWidth: 0 }}><InputLabel>Status</InputLabel>
            <Select label="Status" value={status} onChange={(event) => { setPage(0); setStatus(event.target.value as EnvironmentStatus | ''); }}>
              <MenuItem value="">All statuses</MenuItem>
              {(['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE'] as const).map((value) => <MenuItem key={value} value={value}>{value.replaceAll('_', ' ')}</MenuItem>)}
            </Select></FormControl>
          <FormControl size="small" sx={{ minWidth: 0 }}><InputLabel>Health</InputLabel>
            <Select label="Health" value={health} onChange={(event) => { setPage(0); setHealth(event.target.value as HealthStatus | ''); }}>
              <MenuItem value="">All health</MenuItem>
              {(['HEALTHY', 'UNHEALTHY', 'UNKNOWN'] as const).map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
            </Select></FormControl>
          <FormControl size="small" sx={{ minWidth: 0 }}><InputLabel>Type</InputLabel>
            <Select label="Type" value={type} onChange={(event) => { setPage(0); setType(event.target.value as EnvironmentType | ''); }}>
              <MenuItem value="">All types</MenuItem>
              {(['BROWSER', 'MOBILE', 'API'] as const).map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
            </Select></FormControl>
          <Button variant="text" startIcon={<RefreshIcon />} sx={{ justifySelf: "start" }} onClick={() => void load()}>Refresh</Button>
        </Box>
        {loading ? <Stack spacing={1}>{[1, 2, 3, 4].map((n) => <Skeleton key={n} height={55} />)}</Stack> :
          !data ? <EmptyState title="Environments unavailable" detail="Check the Registry service and try again." /> :
          data.items.length === 0 ? <EmptyState title="No environments found" detail="Try different filters or register a new environment." icon={<DnsOutlinedIcon fontSize="inherit" />} /> :
          <TableContainer><Table size="small">
            <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Platform</TableCell><TableCell>Status</TableCell><TableCell>Health</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
            <TableBody>{data.items.map((item) => <TableRow key={item.environment_id} hover>
              <TableCell><Typography fontWeight={650}>{item.name}</Typography><Typography variant="caption" color="text.secondary">{item.operating_system || 'OS not set'}</Typography></TableCell>
              <TableCell>{item.environment_type}</TableCell>
              <TableCell>{item.platform || '—'}</TableCell>
              <TableCell><StatusChip value={item.status} /></TableCell>
              <TableCell><StatusChip value={item.health_status} /></TableCell>
              <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                <Button size="small" onClick={() => setDetail(item)}>Details</Button>
                <Button size="small" onClick={() => { setEditing(item); setFormOpen(true); }}>Edit</Button>
                <Button size="small" onClick={() => { setStateItem(item); setNextStatus(item.status); setMaintenanceReason(item.maintenance_reason || ''); }}>State</Button>
                <Button size="small" onClick={() => { setHealthItem(item); setNextHealth(item.health_status); }}>Health</Button>
              </TableCell>
            </TableRow>)}</TableBody>
          </Table></TableContainer>}
      </CardContent>
      <TablePagination component="div" count={data?.total || 0} page={page} rowsPerPage={10} rowsPerPageOptions={[10]}
        onPageChange={(_, next) => setPage(next)} />
    </Card>
    <EnvironmentForm open={formOpen} initial={editing} onClose={() => { setFormOpen(false); setEditing(null); }} onSaved={saved} />
    <Detail item={detail} onClose={() => setDetail(null)} />
    <Dialog open={!!stateItem} onClose={() => setStateItem(null)} fullWidth maxWidth="xs">
      <DialogTitle>Change environment state</DialogTitle><DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>This affects new reservation requests for {stateItem?.name}.</Typography>
        <TextField fullWidth select label="Status" value={nextStatus} onChange={(event) => setNextStatus(event.target.value as EnvironmentStatus)}>
          {(['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE'] as const).map((value) => <MenuItem key={value} value={value}>{value.replaceAll('_', ' ')}</MenuItem>)}
        </TextField>
        {nextStatus === 'UNDER_MAINTENANCE' && <TextField fullWidth multiline rows={2} label="Maintenance reason" sx={{ mt: 2 }} required
          value={maintenanceReason} onChange={(event) => setMaintenanceReason(event.target.value)} />}
      </DialogContent><DialogActions><Button onClick={() => setStateItem(null)}>Cancel</Button>
        <Button variant="contained" disabled={actionBusy} onClick={() => void saveStatus()}>{actionBusy ? <CircularProgress size={18} /> : 'Confirm change'}</Button>
      </DialogActions>
    </Dialog>
    <Dialog open={!!healthItem} onClose={() => setHealthItem(null)} fullWidth maxWidth="xs">
      <DialogTitle>Update health</DialogTitle><DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>Set the current health for {healthItem?.name}.</Typography>
        <TextField fullWidth select label="Health" value={nextHealth} onChange={(event) => setNextHealth(event.target.value as HealthStatus)}>
          {(['HEALTHY', 'UNHEALTHY', 'UNKNOWN'] as const).map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
        </TextField>
      </DialogContent><DialogActions><Button onClick={() => setHealthItem(null)}>Cancel</Button>
        <Button variant="contained" disabled={actionBusy} onClick={() => void saveHealth()}>{actionBusy ? <CircularProgress size={18} /> : 'Save health'}</Button>
      </DialogActions>
    </Dialog>
    <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <Alert severity="success" onClose={() => setToast('')}>{toast}</Alert>
    </Snackbar>
  </>;
}
