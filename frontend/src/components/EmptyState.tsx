import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

export function EmptyState({ title, detail, icon }: { title: string; detail: string; icon?: ReactNode }) {
  return <Box sx={{ py: 5, px: 2, textAlign: 'center', color: 'text.secondary' }}>
    {icon && <Box sx={{ fontSize: 38, opacity: 0.65, mb: 1 }}>{icon}</Box>}
    <Typography variant="h6" color="text.primary">{title}</Typography>
    <Typography variant="body2" sx={{ mt: 0.6 }}>{detail}</Typography>
  </Box>;
}
