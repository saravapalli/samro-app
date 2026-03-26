import { Box, Button, Container, Grid, Paper, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlanning } from '../context/PlanningContext';

function formatEventTypeLabel(name?: string) {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function EventSetupPage() {
  const navigate = useNavigate();
  const params = useParams();
  const { event, eventTypes, updateEventSetup, autoGenerateRequirements, createDraftEvent } = usePlanning();

  const eventId = params.eventId ? Number(params.eventId) : undefined;
  const [localTitle, setLocalTitle] = useState('');
  const [localDate, setLocalDate] = useState('');
  const [localBudget, setLocalBudget] = useState<number>(0);
  const [localGuests, setLocalGuests] = useState<number>(0);
  const [localLocation, setLocalLocation] = useState<string>('');

  const eventTypeName = useMemo(() => {
    if (!event) return '';
    return eventTypes.find((t) => t.id === event.eventTypeId)?.name;
  }, [event, eventTypes]);

  useEffect(() => {
    if (!event) return;
    setLocalTitle(event.title);
    setLocalDate(event.eventDate);
    setLocalBudget(event.budget);
    setLocalGuests(event.guestCount);
    setLocalLocation(event.location);
  }, [event]);

  if (!event || (eventId && event.id !== eventId)) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Event not found
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Go to Landing
          </Button>
        </Paper>
      </Container>
    );
  }

  async function onGeneratePlan() {
    updateEventSetup({
      title: localTitle,
      eventDate: localDate,
      budget: localBudget,
      guestCount: localGuests,
      location: localLocation,
    });
    await autoGenerateRequirements();
    navigate(`/events/${event.id}/planner`);
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          {formatEventTypeLabel(eventTypeName)} setup
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 2 }}>
              <Stack spacing={2}>
                <TextField
                  label="Event title"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Location"
                  value={localLocation}
                  onChange={(e) => setLocalLocation(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Event date"
                  type="date"
                  value={localDate}
                  onChange={(e) => setLocalDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />

                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Total budget"
                    type="number"
                    value={localBudget}
                    onChange={(e) => setLocalBudget(Number(e.target.value))}
                    fullWidth
                  />
                  <TextField
                    label="Guest count"
                    type="number"
                    value={localGuests}
                    onChange={(e) => setLocalGuests(Number(e.target.value))}
                    fullWidth
                  />
                </Stack>

                <Button variant="contained" size="large" onClick={onGeneratePlan}>
                  Generate My Plan
                </Button>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 2 }}>
              <Stack spacing={1}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Smart prompts (MVP)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Depending on your event type, we’ll ask a few questions before matching vendors.
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Example for birthdays:
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <Typography variant="body2">• Theme (e.g., Spiderman)</Typography>
                    <Typography variant="body2">• Indoor/outdoor preference</Typography>
                    <Typography variant="body2">• Age group</Typography>
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}

