import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { PageHeader } from '../components/PageHeader';
import { checkService } from '../services/api/health';
import { apiErrorMessage } from '../services/api/client';

interface CheckResult {
  ok: boolean;
  detail: string;
}
interface ServiceReport {
  name: string;
  live: CheckResult | null;
  ready: CheckResult | null;
  checkedAt: Date | null;
}

const initial: Record<'registry' | 'scheduler', ServiceReport> = {
  registry: { name: 'Environment Registry', live: null, ready: null, checkedAt: null },
  scheduler: { name: 'Reservation Scheduler', live: null, ready: null, checkedAt: null },
};

export function HealthPage() {
  const [reports, setReports] = useState(initial);
  const [checking, setChecking] = useState(false);

  const refresh = useCallback(async () => {
    setChecking(true);
    const names = ['registry', 'scheduler'] as const;
    const results = await Promise.all(names.map(async (name) => {
      const [live, ready] = await Promise.allSettled([
        checkService(name, 'live'), checkService(name, 'ready'),
      ]);
      const asResult = (result: PromiseSettledResult<unknown>): CheckResult =>
        result.status === 'fulfilled'
          ? { ok: true, detail: 'Responding' }
          : { ok: false, detail: apiErrorMessage(result.reason) };
      return { name, report: {
        name: initial[name].name, live: asResult(live), ready: asResult(ready), checkedAt: new Date(),
      } };
    }));
    setReports({ registry: results[0].report, scheduler: results[1].report });
    setChecking(false);
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return <>
    <PageHeader title="System Health" subtitle="Service liveness and database-backed readiness"
      action={<Button variant="outlined" startIcon={checking ? <CircularProgress size={16} /> : <RefreshIcon />}
        onClick={() => void refresh()} disabled={checking}>Check now</Button>} />
    <Alert severity="info" sx={{ mb: 3 }}>
      Readiness is reported by each service. Its readiness endpoint queries its own PostgreSQL table; this page does not connect to either database.
      Checks refresh every 30 seconds.
    </Alert>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
      {(['registry', 'scheduler'] as const).map((key) => {
        const report = reports[key];
        return <Card key={key}><CardContent sx={{ p: 3 }}>
          <Typography variant="h6">{report.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {key === 'registry' ? 'Environment catalog and operational state' : 'Reservation scheduling and availability'}
          </Typography>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography>Availability</Typography>
              <Chip size="small" color={!report.live ? 'default' : report.live.ok ? 'success' : 'error'}
                label={!report.live ? 'Checking' : report.live.ok ? 'Available' : 'Unavailable'} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography>Readiness</Typography>
              <Chip size="small" color={!report.ready ? 'default' : report.ready.ok ? 'success' : 'error'}
                label={!report.ready ? 'Checking' : report.ready.ok ? 'Ready' : 'Not ready'} />
            </Box>
            {(report.live?.ok === false || report.ready?.ok === false) &&
              <Alert severity="warning">{report.live?.ok === false ? 'Liveness: ' + report.live.detail : 'Readiness: ' + report.ready?.detail}</Alert>}
            <Typography variant="caption" color="text.secondary">
              Last checked: {report.checkedAt ? report.checkedAt.toLocaleString() : 'Pending'}
            </Typography>
          </Stack>
        </CardContent></Card>;
      })}
    </Box>
  </>;
}
