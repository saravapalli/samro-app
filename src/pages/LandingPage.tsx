import { Box, Button, Card, CardActionArea, CardContent, CircularProgress, Container, Grid, Paper, Stack, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlanning } from '../context/PlanningContext';

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function LandingPage() {
  const navigate = useNavigate();
  const { eventTypes, createDraftEvent } = usePlanning();

  const [eventTypeId, setEventTypeId] = useState<number>(eventTypes[0]?.id ?? 1);
  const [title, setTitle] = useState<string>('My Event');
  const [location, setLocation] = useState<string>('Jersey City');
  const [guestCount, setGuestCount] = useState<number>(25);
  const [budget, setBudget] = useState<number>(3000);
  const [eventDate, setEventDate] = useState<string>(addDays(45));
  const [loading, setLoading] = useState(false);

  const selectedEventType = useMemo(
    () => eventTypes.find((t) => t.id === eventTypeId),
    [eventTypes, eventTypeId],
  );

  async function onStartPlanning() {
    setLoading(true);
    try {
      const userId = 1; // mock
      const eventId = await createDraftEvent({
        eventTypeId,
        title: title.trim() || 'My Event',
        location,
        guestCount,
        budget,
        eventDate,
        userId,
      });
      navigate(`/events/${eventId}/setup`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 4,
        minHeight: '100vh',
        backgroundImage: 'linear-gradient(135deg, rgba(124,58,237,0.10), rgba(6,182,212,0.10))',
      }}
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Stack spacing={2}>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              Plan your event, step by step
            </Typography>
            <Typography variant="body1" color="text.secondary">
              An AI-powered event planning assistant that helps you discover the right vendors and stay within budget — all in one place.
            </Typography>

            <Paper
              sx={{
                p: 2,
                backgroundImage:
                  'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(6,182,212,0.08))',
              }}
              elevation={0}
            >
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                Choose an event type
              </Typography>

              <Grid container spacing={2}>
                {eventTypes.map((t) => (
                  <Grid item xs={12} sm={6} key={t.id}>
                    <Card
                      variant={eventTypeId === t.id ? 'outlined' : undefined}
                      sx={{
                        borderWidth: eventTypeId === t.id ? 2 : 1,
                        borderColor: eventTypeId === t.id ? 'primary.main' : 'divider',
                        transition: 'transform 120ms ease',
                        '&:hover': { transform: 'translateY(-2px)' },
                      }}
                    >
                      <CardActionArea onClick={() => setEventTypeId(t.id)}>
                        <CardContent>
                          <Typography variant="h6">{t.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t.description}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Stack>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper
            sx={{
              p: 2,
              backgroundImage:
                'linear-gradient(135deg, rgba(6,182,212,0.14), rgba(124,58,237,0.10))',
            }}
            elevation={0}
          >
            <Stack spacing={2}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                Quick details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Selected: <strong>{selectedEventType?.name}</strong>
              </Typography>

              <TextField label="Event title" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
              <TextField label="Location (city/area)" value={location} onChange={(e) => setLocation(e.target.value)} fullWidth />

              <Stack direction="row" spacing={2}>
                <TextField
                  label="Estimated budget"
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  fullWidth
                />
              </Stack>

              <Stack direction="row" spacing={2}>
                <TextField
                  label="Guest count"
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  fullWidth
                />
              </Stack>

              <TextField
                label="Event date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <Button
                variant="contained"
                size="large"
                onClick={onStartPlanning}
                disabled={loading}
                sx={{
                  backgroundImage: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                  '&:hover': { backgroundImage: 'linear-gradient(135deg, #6d28d9, #0891b2)' },
                }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Start Planning'}
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, opacity: 0.9 }}>
        <Typography variant="body2" color="text.secondary">
          One-line promise: guided event planning, smart suggestions, and live budget control.
        </Typography>
      </Box>
    </Container>
  );
}

