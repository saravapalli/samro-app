import { Box, Button, Container, Grid, Paper, Stack, Typography } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import { useEffect, useMemo, useState } from 'react';
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

  const requiredList = useMemo(() => sortedRequirements.filter((r) => r.required), [sortedRequirements]);
  const optionalList = useMemo(() => sortedRequirements.filter((r) => !r.required), [sortedRequirements]);

  const requiredComplete = useMemo(() => {
    if (requiredList.length === 0) return true;
    return requiredList.every((r) => shortlistedMatchByRequirementId[r.id]);
  }, [requiredList, shortlistedMatchByRequirementId]);

  const [optionalAccordionOpen, setOptionalAccordionOpen] = useState(false);

  useEffect(() => {
    if (requiredComplete) setOptionalAccordionOpen(true);
  }, [requiredComplete]);

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
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                Your plan
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Required categories first. Optional groups stay tucked away until essentials have vendors.
              </Typography>
            </Box>

            {suggestedNext ? (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'primary.light',
                  backgroundImage: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(6,182,212,0.08))',
                }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  justifyContent="space-between"
                >
                  <Box>
                    <Typography variant="overline" color="secondary" sx={{ fontWeight: 800 }}>
                      Next step
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      {suggestedNext.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add preferences and choose a vendor—this keeps your timeline on track.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate(`/events/${event.id}/requirements/${suggestedNext.id}`)}
                    sx={{
                      minWidth: 200,
                      backgroundImage: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                    }}
                  >
                    Plan this category
                  </Button>
                </Stack>
              </Paper>
            ) : null}

            <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 1 }}>
              Required categories
            </Typography>
            <Grid container spacing={2}>
              {requiredList.map((r) => (
                <Grid item xs={12} md={6} lg={4} key={r.id}>
                  <CategoryCard
                    requirement={r}
                    shortlistedMatch={shortlistedMatchByRequirementId[r.id]}
                    onPlan={() => navigate(`/events/${event.id}/requirements/${r.id}`)}
                  />
                </Grid>
              ))}
            </Grid>

            {optionalList.length > 0 ? (
              <Accordion
                expanded={optionalAccordionOpen}
                onChange={(_, v) => setOptionalAccordionOpen(v)}
                disableGutters
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                  <Typography sx={{ fontWeight: 800 }}>
                    Optional categories ({optionalList.length})
                  </Typography>
                  {!requiredComplete ? (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                      Finish required items first for best results
                    </Typography>
                  ) : null}
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {optionalList.map((r) => (
                      <Grid item xs={12} md={6} lg={4} key={r.id}>
                        <CategoryCard
                          requirement={r}
                          shortlistedMatch={shortlistedMatchByRequirementId[r.id]}
                          onPlan={() => navigate(`/events/${event.id}/requirements/${r.id}`)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ) : null}
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

