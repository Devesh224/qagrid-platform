import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' },
      flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
      <Box>
        <Typography variant="h4" component="h1">{title}</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.7 }}>{subtitle}</Typography>
      </Box>
      {action}
    </Box>
  );
}
