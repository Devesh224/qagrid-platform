import { useEffect, useState } from 'react';
import { Alert, Box, Card, CardContent, Chip, Divider, Skeleton, Stack, Typography } from '@mui/material';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { StatusChip } from '../components/StatusChip';
import { registryApi } from '../services/api/registry';
import { schedulerApi } from '../services/api/scheduler';
import { checkService } from '../services/api/health';
import { apiErrorMessage } from '../services/api/client';
import { formatDateTime } from '../utils/date';
import type { Environment, Reservation } from '../types/api';

const environmentColors = ['#238362', '#d88a24', '#7f8c9c'];
const reservationColors = ['#315faf', '#9daab9', '#238362'];

function Metric({ label, value, loading }: { label: string; value: number | null; loading: boolean }) {
  return <Card><CardContent sx={{ p: 2.5 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    {loading ? <Skeleton width={70} height={47} /> :
      <Typography variant="h4" sx={{ mt: 0.7 }}>{value === null ? '—' : value}</Typography>}
    {value === null && !loading && <Typography variant="caption" color="error">Unavailable</Typography>}
  </CardContent></Card>;
}

function Distribution({ title, data, colors, emptyMessage }: { title: string; data: { name: string; value: number }[] | null; colors: string[]; emptyMessage: string }) {
  return <Card sx={{ height: '100%' }}><CardContent>
    <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>
    {data === null ? <Alert severity="warning">Data unavailable</Alert> :
      data.every((item) => item.value === 0) ? <EmptyState title="No data yet" detail={emptyMessage} /> :
      <Box sx={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>
              {data.map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}
            </Pie>
            <Tooltip formatter={(value) => [value, 'Count']} />
            <Legend verticalAlign="bottom" height={32} />
          </PieChart>
        </ResponsiveContainer>
      </Box>}
  </CardContent></Card>;
}

export function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [environments, setEnvironments] = useState<Environment[] | null>(null);
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [health, setHealth] = useState<{ registry: boolean | null; scheduler: boolean | null }>({ registry: null, scheduler: null });

  useEffect(() => {
    let active = true;
    async function load() {
      const [envResult, reservationResult, registryHealth, schedulerHealth] = await Promise.allSettled([
        registryApi.all(), schedulerApi.all(),
        checkService('registry', 'ready'), checkService('scheduler', 'ready'),
      ]);
      if (!active) return;
      const nextErrors: string[] = [];
      if (envResult.status === 'fulfilled') setEnvironments(envResult.value);
      else nextErrors.push('Environment data: ' + apiErrorMessage(envResult.reason));
      if (reservationResult.status === 'fulfilled') setReservations(reservationResult.value);
      else nextErrors.push('Reservation data: ' + apiErrorMessage(reservationResult.reason));
      setHealth({ registry: registryHealth.status === 'fulfilled', scheduler: schedulerHealth.status === 'fulfilled' });
      setErrors(nextErrors);
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);

  const upcoming = reservations?.filter((item) => item.status === 'CONFIRMED' && new Date(item.start_time).getTime() > Date.now())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()) || [];
  const recent = environments?.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];
  const envChart = environments && [
    { name: 'Active', value: environments.filter((item) => item.status === 'ACTIVE').length },
    { name: 'Maintenance', value: environments.filter((item) => item.status === 'UNDER_MAINTENANCE').length },
    { name: 'Inactive', value: environments.filter((item) => item.status === 'INACTIVE').length },
  ];
  const reservationChart = reservations && [
    { name: 'Confirmed', value: reservations.filter((item) => item.status === 'CONFIRMED').length },
    { name: 'Cancelled', value: reservations.filter((item) => item.status === 'CANCELLED').length },
    { name: 'Completed', value: reservations.filter((item) => item.status === 'COMPLETED').length },
  ];

  return <>
    <PageHeader title="Overview" subtitle="Live environment and reservation operations" />
    {errors.map((error) => <Alert key={error} severity="warning" sx={{ mb: 2 }}>{error}</Alert>)}
    <Typography variant="overline" color="text.secondary">ENVIRONMENTS</Typography>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 2, mb: 3 }}>
      <Metric label="Total registered" value={environments?.length ?? null} loading={loading} />
      <Metric label="Active" value={environments?.filter((x) => x.status === 'ACTIVE').length ?? null} loading={loading} />
      <Metric label="Healthy" value={environments?.filter((x) => x.health_status === 'HEALTHY').length ?? null} loading={loading} />
      <Metric label="Unhealthy" value={environments?.filter((x) => x.health_status === 'UNHEALTHY').length ?? null} loading={loading} />
      <Metric label="Under maintenance" value={environments?.filter((x) => x.status === 'UNDER_MAINTENANCE').length ?? null} loading={loading} />
    </Box>
    <Typography variant="overline" color="text.secondary">RESERVATIONS</Typography>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 2, mb: 3 }}>
      <Metric label="Total reservations" value={reservations?.length ?? null} loading={loading} />
      <Metric label="Confirmed" value={reservations?.filter((x) => x.status === 'CONFIRMED').length ?? null} loading={loading} />
      <Metric label="Cancelled" value={reservations?.filter((x) => x.status === 'CANCELLED').length ?? null} loading={loading} />
      <Metric label="Upcoming" value={reservations ? upcoming.length : null} loading={loading} />
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2, mb: 3 }}>
      <Distribution title="Environment status" data={envChart} colors={environmentColors} emptyMessage="Register an environment to see its distribution." />
      <Distribution title="Reservation status" data={reservationChart} colors={reservationColors} emptyMessage="Create a reservation to see its distribution." />
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2, mb: 3 }}>
      <Card><CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Upcoming reservations</Typography>
        {loading ? <Skeleton height={160} /> : reservations === null ? <Alert severity="warning">Unavailable</Alert> :
          upcoming.length === 0 ? <EmptyState title="No upcoming reservations" detail="Future confirmed bookings will appear here." icon={<EventAvailableOutlinedIcon fontSize="inherit" />} /> :
          <Stack divider={<Divider flexItem />} spacing={1.5}>
            {upcoming.slice(0, 5).map((item) => <Box key={item.reservation_id}>
              <Typography fontWeight={650}>{item.requester}</Typography>
              <Typography variant="body2" color="text.secondary">{formatDateTime(item.start_time)} · {item.purpose}</Typography>
            </Box>)}
          </Stack>}
      </CardContent></Card>
      <Card><CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Recently registered</Typography>
        {loading ? <Skeleton height={160} /> : environments === null ? <Alert severity="warning">Unavailable</Alert> :
          recent.length === 0 ? <EmptyState title="No environments registered" detail="New environments will appear here." icon={<DnsOutlinedIcon fontSize="inherit" />} /> :
          <Stack divider={<Divider flexItem />} spacing={1.5}>
            {recent.slice(0, 5).map((item) => <Box key={item.environment_id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
              <Box><Typography fontWeight={650}>{item.name}</Typography><Typography variant="body2" color="text.secondary">{formatDateTime(item.created_at)}</Typography></Box>
              <StatusChip value={item.status} />
            </Box>)}
          </Stack>}
      </CardContent></Card>
    </Box>
    <Card><CardContent sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
      <Typography variant="h6" sx={{ mr: 1 }}>Service readiness</Typography>
      {(['registry', 'scheduler'] as const).map((name) => <Chip key={name}
        label={name === 'registry' ? 'Environment Registry' : 'Reservation Scheduler'}
        color={health[name] === null ? 'default' : health[name] ? 'success' : 'error'}
        variant="outlined" icon={<Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'currentColor' }} />} />)}
      <Typography variant="caption" color="text.secondary">Readiness includes each service's database check.</Typography>
    </CardContent></Card>
  </>;
}
