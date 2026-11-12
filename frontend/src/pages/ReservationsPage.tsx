import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Skeleton, Snackbar, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { StatusChip } from '../components/StatusChip';
import { registryApi } from '../services/api/registry';
import { schedulerApi } from '../services/api/scheduler';
import { apiErrorMessage } from '../services/api/client';
import { formatDateTime, localInputDefault, toIsoFromLocal } from '../utils/date';
import type { Availability, Environment, Page, Reservation, ReservationCreate, ReservationStatus } from '../types/api';

const schema = z.object({
  environment_id: z.string().min(1, 'Choose an environment'),
  requester: z.string().trim().min(1, 'Requester is required').max(200),
  purpose: z.string().trim().min(1, 'Purpose is required').max(1000),
  start_local: z.string().min(1, 'Start time is required'),
  end_local: z.string().min(1, 'End time is required'),
}).superRefine((values, context) => {
  const start = new Date(values.start_local).getTime();
  const end = new Date(values.end_local).getTime();
  if (!Number.isFinite(start) || start <= Date.now()) {
    context.addIssue({ code: 'custom', path: ['start_local'], message: 'Start must be in the future' });
  }
  if (!Number.isFinite(end) || end <= start) {
    context.addIssue({ code: 'custom', path: ['end_local'], message: 'End must be after start' });
  }
});
type Values = z.infer<typeof schema>;

function BookingDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (item: Reservation) => void }) {
  const { register, control, handleSubmit, reset, setError, watch, formState: { errors } } = useForm<Values>({
    defaultValues: { environment_id: '', requester: '', purpose: '', start_local: localInputDefault(1), end_local: localInputDefault(2) },
  });
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loadingEnvironments, setLoadingEnvironments] = useState(false);
  const [environmentError, setEnvironmentError] = useState('');
  const [serverError, setServerError] = useState('');
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const selectedEnvironment = watch('environment_id');
  const selectedStart = watch('start_local');
  const selectedEnd = watch('end_local');
  useEffect(() => { setAvailability(null); }, [selectedEnvironment, selectedStart, selectedEnd]);

  useEffect(() => {
    if (!open) return;
    reset({ environment_id: '', requester: '', purpose: '', start_local: localInputDefault(1), end_local: localInputDefault(2) });
    setServerError(''); setAvailability(null);
    let active = true;
    setLoadingEnvironments(true); setEnvironmentError('');
    registryApi.allAvailable().then((items) => { if (active) setEnvironments(items); })
      .catch((error) => { if (active) { setEnvironments([]); setEnvironmentError(apiErrorMessage(error)); } })
      .finally(() => { if (active) setLoadingEnvironments(false); });
    return () => { active = false; };
  }, [open, reset]);

  function parse(values: Values): ReservationCreate | null {
    const result = schema.safeParse(values);
    if (!result.success) {
      result.error.issues.forEach((issue) => setError(issue.path[0] as keyof Values, { message: issue.message }));
      return null;
    }
    return {
      environment_id: result.data.environment_id,
      requester: result.data.requester,
      purpose: result.data.purpose,
      start_time: toIsoFromLocal(result.data.start_local),
      end_time: toIsoFromLocal(result.data.end_local),
    };
  }

  async function check(values: Values) {
    const request = parse(values);
    if (!request) return;
    setChecking(true); setServerError(''); setAvailability(null);
    try {
      setAvailability(await schedulerApi.availability(request.environment_id, request.start_time, request.end_time));
    } catch (error) { setServerError(apiErrorMessage(error)); }
    finally { setChecking(false); }
  }

  async function submit(values: Values) {
    const request = parse(values);
    if (!request) return;
    setSaving(true); setServerError('');
    try {
      onCreated(await schedulerApi.create(request));
    } catch (error) {
      setServerError(apiErrorMessage(error));
      setAvailability(null);
    } finally { setSaving(false); }
  }

  return <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
    <DialogTitle>Create reservation</DialogTitle>
    <Box component="form" onSubmit={handleSubmit(submit)}>
      <DialogContent sx={{ display: 'grid', gap: 2, pt: '12px !important' }}>
        {serverError && <Alert severity="error">{serverError}</Alert>}
        {environmentError && <Alert severity="warning">Available environments could not be loaded: {environmentError}</Alert>}
        <Controller name="environment_id" control={control} render={({ field }) =>
          <TextField {...field} select label="Environment" error={!!errors.environment_id} helperText={errors.environment_id?.message}
            disabled={loadingEnvironments || !!environmentError}>
            {environments.map((item) => <MenuItem key={item.environment_id} value={item.environment_id}>{item.name} · {item.environment_type}</MenuItem>)}
          </TextField>} />
        {!loadingEnvironments && !environmentError && environments.length === 0 &&
          <Alert severity="info">No ACTIVE and HEALTHY environments are available. Set health in Environment Management first.</Alert>}
        <TextField label="Requester" {...register('requester')} error={!!errors.requester} helperText={errors.requester?.message} required />
        <TextField label="Purpose" {...register('purpose')} multiline rows={2} error={!!errors.purpose} helperText={errors.purpose?.message} required />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField label="Start time" type="datetime-local" {...register('start_local')} error={!!errors.start_local}
            helperText={errors.start_local?.message || 'Your local time zone'} slotProps={{ inputLabel: { shrink: true } }} required />
          <TextField label="End time" type="datetime-local" {...register('end_local')} error={!!errors.end_local}
            helperText={errors.end_local?.message || 'Your local time zone'} slotProps={{ inputLabel: { shrink: true } }} required />
        </Box>
        {availability && <Alert severity={availability.available ? 'success' : 'warning'}>
          {availability.available ? 'Slot appears available.' : 'Slot is currently occupied.'}
        </Alert>}
        <Typography variant="caption" color="text.secondary">
          Availability is advisory. Another engineer may book the slot before you submit. The Scheduler makes the final decision.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, flexWrap: 'wrap' }}>
        <Button onClick={onClose} disabled={saving}>Close</Button>
        <Button variant="outlined" disabled={checking || saving || !!environmentError || environments.length === 0}
          onClick={handleSubmit(check)}>{checking ? 'Checking…' : 'Check availability'}</Button>
        <Button type="submit" variant="contained" disabled={saving || !!environmentError || environments.length === 0}>
          {saving ? <CircularProgress size={18} /> : 'Create reservation'}
        </Button>
      </DialogActions>
    </Box>
  </Dialog>;
}

function ReservationDetail({ item, environmentName, onClose }: { item: Reservation | null; environmentName: string; onClose: () => void }) {
  if (!item) return null;
  return <Dialog open onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>Reservation details</DialogTitle><DialogContent>
      <StatusChip value={item.status} />
      <Stack spacing={1.5} sx={{ mt: 2 }}>
        {[
          ['Reservation ID', item.reservation_id], ['Environment', environmentName], ['Environment ID', item.environment_id],
          ['Requester', item.requester], ['Purpose', item.purpose],
          ['Starts', formatDateTime(item.start_time)], ['Ends', formatDateTime(item.end_time)],
          ['Created', formatDateTime(item.created_at)],
        ].map(([label, value]) => <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          <Typography variant="body2" sx={{ textAlign: 'right', overflowWrap: 'anywhere' }}>{value}</Typography>
        </Box>)}
      </Stack>
    </DialogContent><DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
  </Dialog>;
}

export function ReservationsPage() {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<ReservationStatus | ''>('');
  const [environmentFilter, setEnvironmentFilter] = useState('');
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [environmentError, setEnvironmentError] = useState('');
  const [data, setData] = useState<Page<Reservation> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<Reservation | null>(null);
  const [confirm, setConfirm] = useState<{ item: Reservation; action: 'cancel' | 'complete' } | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [lastCreated, setLastCreated] = useState<Reservation | null>(null);
  const names = useMemo(() => new Map(environments.map((item) => [item.environment_id, item.name])), [environments]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      setData(await schedulerApi.list({ status: status || undefined,
        environment_id: environmentFilter || undefined, limit: 10, offset: page * 10 }));
    } catch (failure) { setData(null); setError(apiErrorMessage(failure)); }
    finally { setLoading(false); }
  }, [status, environmentFilter, page]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    let active = true;
    registryApi.all().then((items) => { if (active) setEnvironments(items); })
      .catch((failure) => { if (active) setEnvironmentError(apiErrorMessage(failure)); });
    return () => { active = false; };
  }, []);

  function created(item: Reservation) {
    setFormOpen(false); setLastCreated(item);
    setToast('Reservation created.'); void load();
  }
  async function applyAction() {
    if (!confirm) return;
    setBusy(true); setError('');
    try {
      if (confirm.action === 'cancel') await schedulerApi.cancel(confirm.item.reservation_id);
      else await schedulerApi.complete(confirm.item.reservation_id);
      setToast(confirm.action === 'cancel' ? 'Reservation cancelled.' : 'Reservation completed.');
      setConfirm(null); await load();
    } catch (failure) { setError(apiErrorMessage(failure)); }
    finally { setBusy(false); }
  }

  return <>
    <PageHeader title="Reservations" subtitle="Schedule exclusive QA execution slots"
      action={<Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>New reservation</Button>} />
    {error && <Alert severity="error" sx={{ mb: 2, overflowWrap: "anywhere", "& .MuiAlert-message": { minWidth: 0 } }} onClose={() => setError('')}>{error}</Alert>}
    {environmentError && <Alert severity="warning" sx={{ mb: 2, overflowWrap: "anywhere", "& .MuiAlert-message": { minWidth: 0 } }}>Environment names and filtering unavailable: {environmentError}. Reservation IDs remain visible.</Alert>}
    {lastCreated && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setLastCreated(null)}>
      Reservation created: <strong>{lastCreated.reservation_id}</strong>. Starts {formatDateTime(lastCreated.start_time)}.
    </Alert>}
    <Card sx={{ minWidth: 0 }}><CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: '165px minmax(200px, 1fr) auto' }, gap: 1.5, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 0 }}><InputLabel>Status</InputLabel>
          <Select label="Status" value={status} onChange={(event) => { setPage(0); setStatus(event.target.value as ReservationStatus | ''); }}>
            <MenuItem value="">All statuses</MenuItem>
            {(['CONFIRMED', 'CANCELLED', 'COMPLETED'] as const).map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
          </Select></FormControl>
        <FormControl size="small" sx={{ minWidth: 0 }}><InputLabel>Environment</InputLabel>
          <Select label="Environment" value={environmentFilter} onChange={(event) => { setPage(0); setEnvironmentFilter(event.target.value); }}>
            <MenuItem value="">All environments</MenuItem>
            {environments.map((item) => <MenuItem key={item.environment_id} value={item.environment_id}>{item.name}</MenuItem>)}
          </Select></FormControl>
        <Button startIcon={<RefreshIcon />} sx={{ justifySelf: "start" }} onClick={() => void load()}>Refresh</Button>
      </Box>
      {loading ? <Stack spacing={1}>{[1, 2, 3, 4].map((n) => <Skeleton key={n} height={55} />)}</Stack> :
        !data ? <EmptyState title="Reservations unavailable" detail="Check Scheduler health and try again." /> :
        data.items.length === 0 ? <EmptyState title="No reservations found" detail="Create a reservation or adjust the filters." icon={<EventAvailableOutlinedIcon fontSize="inherit" />} /> :
        <TableContainer><Table size="small">
          <TableHead><TableRow><TableCell>Environment</TableCell><TableCell>Requester</TableCell><TableCell>Time slot</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
          <TableBody>{data.items.map((item) => <TableRow key={item.reservation_id} hover>
            <TableCell sx={{ fontWeight: 650 }}>{names.get(item.environment_id) || item.environment_id}</TableCell>
            <TableCell>{item.requester}</TableCell>
            <TableCell>{formatDateTime(item.start_time)}<Typography variant="caption" display="block" color="text.secondary">to {formatDateTime(item.end_time)}</Typography></TableCell>
            <TableCell><StatusChip value={item.status} /></TableCell>
            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
              <Button size="small" onClick={() => setDetail(item)}>Details</Button>
              {item.status === 'CONFIRMED' && <>
                <Button size="small" color="error" onClick={() => setConfirm({ item, action: 'cancel' })}>Cancel</Button>
                {new Date(item.end_time).getTime() <= Date.now() &&
                  <Button size="small" onClick={() => setConfirm({ item, action: 'complete' })}>Complete</Button>}
              </>}
            </TableCell>
          </TableRow>)}</TableBody>
        </Table></TableContainer>}
    </CardContent>
    <TablePagination component="div" count={data?.total || 0} page={page} rowsPerPage={10} rowsPerPageOptions={[10]}
      sx={{ ".MuiTablePagination-toolbar": { flexWrap: "wrap", justifyContent: "flex-end" } }}
      onPageChange={(_, next) => setPage(next)} />
    </Card>
    <BookingDialog open={formOpen} onClose={() => setFormOpen(false)} onCreated={created} />
    <ReservationDetail item={detail} environmentName={detail ? names.get(detail.environment_id) || detail.environment_id : ''}
      onClose={() => setDetail(null)} />
    <Dialog open={!!confirm} onClose={() => setConfirm(null)} fullWidth maxWidth="xs">
      <DialogTitle>{confirm?.action === 'cancel' ? 'Cancel reservation?' : 'Complete reservation?'}</DialogTitle>
      <DialogContent><Typography>
        {confirm?.action === 'cancel'
          ? 'Cancelling releases this time slot for other engineers.'
          : 'Mark this finished reservation as completed.'}
      </Typography></DialogContent>
      <DialogActions><Button onClick={() => setConfirm(null)}>Keep reservation</Button>
        <Button color={confirm?.action === 'cancel' ? 'error' : 'primary'} variant="contained" disabled={busy} onClick={() => void applyAction()}>
          {busy ? <CircularProgress size={18} /> : confirm?.action === 'cancel' ? 'Cancel reservation' : 'Complete'}
        </Button>
      </DialogActions>
    </Dialog>
    <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <Alert severity="success" onClose={() => setToast('')}>{toast}</Alert>
    </Snackbar>
  </>;
}
