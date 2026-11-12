import { Chip } from '@mui/material';

const colors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  ACTIVE: 'success', INACTIVE: 'default', UNDER_MAINTENANCE: 'warning',
  HEALTHY: 'success', UNHEALTHY: 'error', UNKNOWN: 'default',
  CONFIRMED: 'info', CANCELLED: 'default', COMPLETED: 'success',
};
export function StatusChip({ value }: { value: string }) {
  return <Chip label={value.replaceAll('_', ' ')} color={colors[value] || 'default'} size="small"
    variant={value === 'INACTIVE' || value === 'UNKNOWN' || value === 'CANCELLED' ? 'outlined' : 'filled'}
    sx={{ fontWeight: 700, fontSize: 11, letterSpacing: 0.2 }} />;
}
