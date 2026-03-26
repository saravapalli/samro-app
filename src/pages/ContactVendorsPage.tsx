import { Box, Button, CircularProgress, Container, Paper, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlanning } from '../context/PlanningContext';

export function ContactVendorsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const eventId = params.eventId ? Number(params.eventId) : undefined;

  const { event, requirements, shortlistedMatchByRequirementId, contactShortlisted, leads } = usePlanning();

  const selected = useMemo(() => {
    return requirements
      .map((r) => {
        const match = shortlistedMatchByRequirementId[r.id];
        return match ? { requirement: r, match } : null;
      })
      .filter(Boolean) as { requirement: typeof requirements[number]; match: NonNullable<(typeof shortlistedMatchByRequirementId)[number]> }[];
  }, [requirements, shortlistedMatchByRequirementId]);

  const [messages, setMessages] = useState<Record<number, string>>({});
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    const next: Record<number, string> = {};
    for (const item of selected) {
      next[item.requirement.id] =
        `Hi, I need ${item.requirement.title.toLowerCase()} for my event (${event?.eventDate}) in ${event?.location}.`;
    }
    setMessages(next);
  }, [selected, event?.eventDate, event?.location]);

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

  async function onContactNow() {
    setContacting(true);
    try {
      await contactShortlisted(
        selected.map((s) => ({
          requirementId: s.requirement.id,
          message: messages[s.requirement.id] ?? '',
        })),
      );
    } finally {
      setContacting(false);
    }
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 4,
        minHeight: '100vh',
        backgroundImage: 'linear-gradient(135deg, rgba(6,182,212,0.10), rgba(124,58,237,0.08))',
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Contact vendors
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create leads/inquiries for your selected vendors (mocked in this UI).
            </Typography>
          </Box>
          <Button variant="outlined" onClick={() => navigate(`/events/${event.id}/review`)}>
            Back to review
          </Button>
        </Stack>

        {selected.length === 0 ? (
          <Paper
            sx={{
              p: 2,
              backgroundImage: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(6,182,212,0.04))',
            }}
            elevation={0}
          >
            <Typography variant="body2" color="text.secondary">
              No vendors selected yet. Go back and shortlist options first.
            </Typography>
          </Paper>
        ) : null}

        <Stack spacing={2}>
          {selected.map((s) => {
            const existingLead = leads.find((l) => l.matchId === s.match.id);
            return (
              <Paper
                key={s.requirement.id}
                sx={{
                  p: 2,
                  backgroundImage: 'linear-gradient(135deg, rgba(6,182,212,0.06), rgba(124,58,237,0.04))',
                }}
                elevation={0}
              >
                <Stack spacing={1}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {s.requirement.title}: {s.match.businessName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Estimated price: ${s.match.estimatedPrice.toLocaleString()}
                  </Typography>

                  <TextField
                    label="Message"
                    value={messages[s.requirement.id] ?? ''}
                    onChange={(e) => setMessages((prev) => ({ ...prev, [s.requirement.id]: e.target.value }))}
                    multiline
                    minRows={3}
                    fullWidth
                  />

                  <Typography variant="body2">
                    Status:{' '}
                    <strong>{existingLead ? existingLead.status : 'Not contacted'}</strong>
                  </Typography>
                </Stack>
              </Paper>
            );
          })}
        </Stack>

        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={onContactNow} disabled={selected.length === 0 || contacting}>
            {contacting ? <CircularProgress size={20} color="inherit" /> : 'Contact now'}
          </Button>
          <Button variant="outlined" onClick={() => navigate(`/events/${event.id}/planner`)}>
            Save and come back later
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}

