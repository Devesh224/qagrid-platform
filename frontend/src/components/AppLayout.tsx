import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppBar, Avatar, Box, Chip, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

const width = 252;
const nav = [
  { path: '/', label: 'Overview', icon: <DashboardOutlinedIcon /> },
  { path: '/environments', label: 'Environments', icon: <DnsOutlinedIcon /> },
  { path: '/reservations', label: 'Reservations', icon: <EventAvailableOutlinedIcon /> },
  { path: '/health', label: 'System Health', icon: <MonitorHeartOutlinedIcon /> },
  { path: '/api-docs', label: 'API Documentation', icon: <MenuBookOutlinedIcon /> },
  { path: '/settings', label: 'Settings', icon: <SettingsOutlinedIcon /> },
];

export function AppLayout() {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const current = nav.find((item) => item.path === location.pathname)?.label || 'QAGrid';

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box sx={{ px: 3, py: 3.2 }}>
        <Typography variant="h5" color="primary" sx={{ letterSpacing: '-0.04em' }}>QAGrid</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45, display: 'block', mt: 0.5 }}>
          QA Test Environment &amp;<br />Execution Slot Management
        </Typography>
      </Box>
      <Divider />
      <Typography variant="overline" color="text.secondary" sx={{ px: 3, pt: 2.4, pb: 0.7, letterSpacing: 1.5 }}>
        WORKSPACE
      </Typography>
      <List sx={{ px: 1.5 }}>
        {nav.map((item) => (
          <ListItemButton key={item.path} selected={location.pathname === item.path}
            onClick={() => { navigate(item.path); setOpen(false); }}
            sx={{ mb: 0.5, borderRadius: 2, '&.Mui-selected': { bgcolor: 'primary.main', color: 'white',
              '& .MuiListItemIcon-root': { color: 'white' },
              '&:hover': { bgcolor: 'primary.dark' } } }}>
            <ListItemIcon sx={{ minWidth: 39, color: 'inherit' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 650 }} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <Box sx={{ px: 3, py: 2 }}>
        <Typography variant="caption" color="text.secondary">QAGrid Dashboard · v1.0</Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" color="inherit" elevation={0}
        sx={{ width: { md: 'calc(100% - 252px)' }, ml: { md: '252px' },
          borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Toolbar sx={{ minHeight: 70, gap: 2 }}>
          {compact && <IconButton edge="start" aria-label="Open navigation" onClick={() => setOpen(true)}><MenuIcon /></IconButton>}
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ lineHeight: 1.1 }}>{current}</Typography>
            <Typography variant="caption" color="text.secondary">Environment operations</Typography>
          </Box>
          <Chip label="Operations console" variant="outlined" size="small" sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />
          <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 15 }}>Q</Avatar>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: width }, flexShrink: { md: 0 } }}>
        <Drawer variant={compact ? 'temporary' : 'permanent'} open={compact ? open : true}
          onClose={() => setOpen(false)} ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width, boxSizing: 'border-box', borderRight: '1px solid', borderColor: 'divider' } }}>
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ width: { xs: '100vw', md: 'calc(100% - 252px)' }, flexShrink: 0, minWidth: 0, pt: '94px', px: { xs: 2, sm: 3, lg: 4 }, pb: 5 }}>
        <Box sx={{ maxWidth: 1480, width: '100%', minWidth: 0, mx: 'auto' }}><Outlet /></Box>
      </Box>
    </Box>
  );
}
