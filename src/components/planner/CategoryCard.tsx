import { Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import type { BusinessMatch, PlanningRequirement } from '../../context/PlanningContext';

export function CategoryCard(props: {
  requirement: PlanningRequirement;
  shortlistedMatch?: BusinessMatch;
  onPlan: () => void;
}) {
  const { requirement, shortlistedMatch } = props;

  const requiredChipColor = requirement.required ? 'primary' : 'secondary';

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: requirement.required ? 'primary.main' : 'secondary.main',
        borderWidth: 2,
        backgroundImage: requirement.required
          ? 'linear-gradient(135deg, rgba(124,58,237,0.10), rgba(6,182,212,0.04))'
          : 'linear-gradient(135deg, rgba(6,182,212,0.10), rgba(124,58,237,0.04))',
      }}
    >
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6">{requirement.title}</Typography>
            {requirement.required ? (
              <Chip label="Required" color={requiredChipColor as any} size="small" />
            ) : (
              <Chip label="Optional" color={requiredChipColor as any} size="small" />
            )}
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Budget allocated: ${(
              requirement.userBudgetOverride ?? requirement.budgetAllocated
            ).toLocaleString()}
          </Typography>

          {shortlistedMatch ? (
            <Stack spacing={0.5}>
              <Typography variant="body2">Selected: {shortlistedMatch.businessName}</Typography>
              <Typography variant="body2" color="text.secondary">
                Estimated cost: ${shortlistedMatch.estimatedPrice.toLocaleString()}
              </Typography>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Not selected yet
            </Typography>
          )}

          <Button
            variant="contained"
            onClick={props.onPlan}
            sx={{
              backgroundImage: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              '&:hover': { backgroundImage: 'linear-gradient(135deg, #6d28d9, #0891b2)' },
            }}
          >
            {shortlistedMatch ? 'Plan / Edit' : 'Plan this'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

