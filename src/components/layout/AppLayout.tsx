import { Box, Chip, CssBaseline, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import AppBar from '@mui/material/AppBar';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import HomeRounded from '@mui/icons-material/HomeRounded';
import EventRounded from '@mui/icons-material/EventRounded';
import AssignmentTurnedInRounded from '@mui/icons-material/AssignmentTurnedInRounded';
import LocalPhoneRounded from '@mui/icons-material/LocalPhoneRounded';
import { usePlanning } from '../../context/PlanningContext';

const drawerWidth = 270;

function getSelectedKey(pathname: string) {
  if (pathname === '/' || pathname === '') return 'landing';
  if (pathname.includes('/setup')) return 'setup';
  if (pathname.includes('/planner')) return 'planner';
  if (pathname.includes('/requirements/')) return 'planner';
  if (pathname.includes('/review')) return 'review';
  if (pathname.includes('/contact')) return 'contact';
  return 'landing';
}

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { event } = usePlanning();

  const selectedKey = getSelectedKey(location.pathname);

  const items = useMemo(() => {
    const hasEvent = Boolean(event?.id);
    const eventId = event?.id;
    return [
      { key: 'landing', label: 'Start', path: '/', icon: <HomeRounded /> },
      {
        key: 'setup',
        label: 'Setup',
        path: hasEvent ? `/events/${eventId}/setup` : '/',
        icon: <EventRounded />,
        disabled: !hasEvent,
      },
      {
        key: 'planner',
        label: 'Planner',
        path: hasEvent ? `/events/${eventId}/planner` : '/',
        icon: <AssignmentTurnedInRounded />,
        disabled: !hasEvent,
      },
      {
        key: 'review',
        label: 'Review',
        path: hasEvent ? `/events/${eventId}/review` : '/',
        icon: <AssignmentTurnedInRounded />,
        disabled: !hasEvent,
      },
      {
        key: 'contact',
        label: 'Contact',
        path: hasEvent ? `/events/${eventId}/contact` : '/',
        icon: <LocalPhoneRounded />,
        disabled: !hasEvent,
      },
    ];
  }, [event?.id]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage:
          'radial-gradient(circle at 10% 10%, rgba(124,58,237,0.12), transparent 35%), radial-gradient(circle at 90% 20%, rgba(6,182,212,0.12), transparent 40%), linear-gradient(135deg, #f5f7ff, #f0fbff)',
      }}
    >
      {/* Top navigation */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label="samroUI"
              color="primary"
              variant="filled"
              sx={{ fontWeight: 900 }}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {event ? (
            <Chip
              label={`Planning: ${event.title}`}
              variant="outlined"
              color="secondary"
              sx={{ maxWidth: 420 }}
            />
          ) : (
            <Chip label="Start a new plan" variant="outlined" color="primary" />
          )}
        </Toolbar>
      </AppBar>

      <CssBaseline />

      {/* Left navigation + routed content */}
      <Box sx={{ display: 'flex' }}>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: 'border-box',
              backgroundImage:
                'linear-gradient(180deg, rgba(124,58,237,0.08), rgba(6,182,212,0.05))',
              borderRight: '1px solid rgba(0,0,0,0.06)',
            },
          }}
        >
          <Toolbar />
          <List sx={{ px: 1 }}>
            {items.map((it) => (
              <ListItemButton
                key={it.key}
                selected={selectedKey === it.key}
                disabled={it.disabled}
                onClick={() => navigate(it.path)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{it.icon}</ListItemIcon>
                <ListItemText primary={it.label} />
              </ListItemButton>
            ))}
          </List>
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, p: 3, minWidth: 0 }}>
          <Toolbar />
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

