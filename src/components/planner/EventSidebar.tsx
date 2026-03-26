import { Box, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import type { BusinessMatch, EventDraft, PlanningRequirement } from '../../context/PlanningContext';

export function EventSidebar(props: {
  event: EventDraft;
  requirements: PlanningRequirement[];
  shortlistedMatchByRequirementId: Record<number, BusinessMatch | undefined>;
  onPlanRequirement?: (requirementId: number) => void;
}) {
  const { event, requirements, shortlistedMatchByRequirementId } = props;

  const selectedMatches = requirements
    .map((r) => shortlistedMatchByRequirementId[r.id])
    .filter(Boolean) as BusinessMatch[];

  const selectedSpend = selectedMatches.reduce((sum, m) => sum + (m.estimatedPrice ?? 0), 0);
  const remaining = (event.budget ?? 0) - selectedSpend;

  const requiredTotal = requirements.filter((r) => r.required).length || 1;
  const requiredCompleted = requirements.filter((r) => r.required && shortlistedMatchByRequirementId[r.id]).length;
  const progressPct = Math.round((requiredCompleted / requiredTotal) * 100);

  return (
    <Paper
      sx={{
        p: 2,
        backgroundImage: 'linear-gradient(135deg, rgba(124,58,237,0.10), rgba(6,182,212,0.08))',
      }}
      elevation={0}
    >
      <Stack spacing={1.5}>
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          {event.title || 'Your Event'}
        </Typography>
        <Stack spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            Total budget
          </Typography>
          <Typography variant="h5">${event.budget.toLocaleString()}</Typography>
        </Stack>

        <Box>
          <Typography variant="body2" color="text.secondary">
            Remaining
          </Typography>
          <Typography variant="h6" color={remaining < 0 ? 'error.main' : 'text.primary'}>
            ${remaining.toLocaleString()}
          </Typography>
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Required progress ({requiredCompleted}/{requiredTotal})
          </Typography>
          <LinearProgress variant="determinate" value={progressPct} />
        </Box>

        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Selected
        </Typography>
        {selectedMatches.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nothing selected yet. Start with the required categories.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {selectedMatches.map((m) => (
              <Paper
                key={m.id}
                variant="outlined"
                sx={{ p: 1, cursor: props.onPlanRequirement ? 'pointer' : 'default' }}
                onClick={() => props.onPlanRequirement?.(m.requirementId)}
              >
                <Typography variant="body2" fontWeight={600}>
                  {m.businessName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Estimated: ${m.estimatedPrice.toLocaleString()}
                </Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

