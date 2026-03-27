import { Box, Button, Container, Grid, Paper, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlanning } from '../context/PlanningContext';

export function FinalReviewPage() {
  const navigate = useNavigate();
  const params = useParams();
  const eventId = params.eventId ? Number(params.eventId) : undefined;

  const { event, requirements, shortlistedMatchByRequirementId, removeShortlist } = usePlanning();

  const selected = useMemo(() => {
    return requirements
      .map((r) => ({
        requirement: r,
        match: shortlistedMatchByRequirementId[r.id],
      }))
      .filter((x) => x.match) as { requirement: typeof requirements[number]; match: NonNullable<(typeof shortlistedMatchByRequirementId)[number]> }[];
  }, [requirements, shortlistedMatchByRequirementId]);

  const selectedSpend = selected.reduce((sum, x) => sum + (x.match.estimatedPrice ?? 0), 0);
  const remaining = event ? event.budget - selectedSpend : 0;

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

  const incompleteRequired = requirements.filter((r) => r.required && !shortlistedMatchByRequirementId[r.id]).length;

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 4,
        minHeight: '100vh',
        backgroundImage: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.08))',
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Final review
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review your selections and stay within budget.
            </Typography>
          </Box>

          <Paper
            sx={{
              p: 1.5,
              backgroundImage: 'linear-gradient(135deg, rgba(34,197,94,0.10), rgba(6,182,212,0.06))',
            }}
            elevation={0}
          >
            <Typography variant="body2">
              Remaining budget: <strong>${remaining.toLocaleString()}</strong>
            </Typography>
          </Paper>
        </Stack>

        {incompleteRequired > 0 ? (
          <Paper
            sx={{
              p: 2,
              backgroundImage: 'linear-gradient(135deg, rgba(245,158,11,0.14), rgba(239,68,68,0.06))',
            }}
            elevation={0}
          >
            <Typography variant="body2">
              Incomplete required categories: <strong>{incompleteRequired}</strong>
            </Typography>
          </Paper>
        ) : null}

        <Grid container spacing={2}>
          {requirements.map((r) => {
            const match = shortlistedMatchByRequirementId[r.id];
            return (
              <Grid item xs={12} md={6} key={r.id}>
                <Paper
                  sx={{
                    p: 2,
                    backgroundImage: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(6,182,212,0.04))',
                  }}
                  elevation={0}
                >
                  <Stack spacing={1}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {r.title} {r.required ? '(Required)' : '(Optional)'}
                    </Typography>

                    {match ? (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Selected: <strong>{match.businessName}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Estimated: ${match.estimatedPrice.toLocaleString()}
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/requirements/${r.id}/matches`)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="text"
                            size="small"
                            color="error"
                            onClick={() => removeShortlist(r.id)}
                          >
                            Remove
                          </Button>
                        </Stack>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not selected yet. Choose a business to continue.
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => navigate(`/events/${event.id}/planner`)}>
            Back to planner
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate(`/events/${event.id}/contact`)}
            disabled={incompleteRequired > 0}
          >
            Continue to Contact Vendors
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}

