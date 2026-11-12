import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { PageHeader } from '../components/PageHeader';
import { getApiConfig } from '../services/api/config';

export function ApiDocsPage() {
  const config = getApiConfig();
  return <>
    <PageHeader title="API Documentation" subtitle="Open the live FastAPI Swagger pages for each implemented service" />
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
      {[
        { name: 'Environment Registry', description: 'Environment registration, status, health and search', url: config.registryDocs },
        { name: 'Reservation Scheduler', description: 'Availability, booking, cancellation and completion', url: config.schedulerDocs },
      ].map((item) => <Card key={item.name}><CardContent sx={{ p: 3 }}>
        <MenuBookOutlinedIcon color="primary" sx={{ fontSize: 34, mb: 1 }} />
        <Typography variant="h6">{item.name}</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5, mb: 2 }}>{item.description}</Typography>
        <Button component="a" href={item.url} target="_blank" rel="noopener noreferrer"
          variant="outlined" endIcon={<OpenInNewIcon />}>Open Swagger docs</Button>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5, overflowWrap: 'anywhere' }}>{item.url}</Typography>
      </CardContent></Card>)}
    </Box>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
      When using Minikube, keep the Registry and Scheduler port-forward commands running to open these browser URLs.
      Test Execution and Notification are planned services and have no API documentation pages.
    </Typography>
  </>;
}
