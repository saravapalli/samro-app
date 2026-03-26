import { Box, Button, Container, Grid, Paper, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CategoryCard } from '../components/planner/CategoryCard';
import { EventSidebar } from '../components/planner/EventSidebar';
import { usePlanning } from '../context/PlanningContext';

export function PlannerDashboardPage() {
  const navigate = useNavigate();
  const params = useParams();
  const { event, requirements, shortlistedMatchByRequirementId } = usePlanning();

  const eventId = params.eventId ? Number(params.eventId) : undefined;

  const sortedRequirements = useMemo(() => {
    return [...requirements].sort((a, b) => {
      if (a.required !== b.required) return a.required ? -1 : 1;
      return (b.priorityWeight ?? 0) - (a.priorityWeight ?? 0);
    });
  }, [requirements]);

  const suggestedNext = useMemo(() => {
    const unfilledRequired = sortedRequirements.filter((r) => r.required && !shortlistedMatchByRequirementId[r.id]);
    if (unfilledRequired.length > 0) return unfilledRequired[0];
    return sortedRequirements.find((r) => !shortlistedMatchByRequirementId[r.id]) ?? null;
  }, [sortedRequirements, shortlistedMatchByRequirementId]);

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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  Your plan
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Required first, then high-priority optional categories.
                </Typography>
              </Box>

              {suggestedNext ? (
                <Paper sx={{ p: 1.5 }}>
                  <Typography variant="body2">
                    Suggested next: <strong>{suggestedNext.title}</strong>
                  </Typography>
                </Paper>
              ) : null}
            </Stack>

            <Grid container spacing={2}>
              {sortedRequirements.map((r) => (
                <Grid item xs={12} md={6} lg={4} key={r.id}>
                  <CategoryCard
                    requirement={r}
                    shortlistedMatch={shortlistedMatchByRequirementId[r.id]}
                    onPlan={() => navigate(`/events/${event.id}/requirements/${r.id}`)}
                  />
                </Grid>
              ))}
            </Grid>
          </Stack>

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button variant="outlined" onClick={() => navigate(`/events/${event.id}/review`)}>
              Final review
            </Button>
            <Button variant="contained" onClick={() => navigate(`/events/${event.id}/contact`)}>
              Contact vendors
            </Button>
          </Stack>
        </Grid>

        <Grid item xs={12} md={3}>
          <EventSidebar
            event={event}
            requirements={requirements}
            shortlistedMatchByRequirementId={shortlistedMatchByRequirementId}
            onPlanRequirement={(requirementId) => navigate(`/events/${event.id}/requirements/${requirementId}`)}
          />
        </Grid>
      </Grid>
    </Container>
  );
}

