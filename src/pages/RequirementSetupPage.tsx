import { Box, Button, Container, FormControl, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlanning } from '../context/PlanningContext';

export function RequirementSetupPage() {
  const navigate = useNavigate();
  const params = useParams();
  const { event, requirements, shortlistedMatchByRequirementId, setRequirementBudgetOverride, setRequirementDiyOrHire, upsertRequirementMetadata, generateMatchesForRequirement } =
    usePlanning();

  const requirementId = params.requirementId ? Number(params.requirementId) : undefined;
  const requirement = requirements.find((r) => r.id === requirementId);

  const [budgetOverride, setBudgetOverride] = useState<number | ''>('');
  const [mode, setMode] = useState<'hire' | 'diy'>('hire');
  const [theme, setTheme] = useState<string>('');
  const [preference, setPreference] = useState<string>('');

  const existingShortlist = requirementId ? shortlistedMatchByRequirementId[requirementId] : undefined;

  useEffect(() => {
    if (!requirement) return;
    setBudgetOverride(requirement.userBudgetOverride ?? '');
    setMode(requirement.diyOrHire);

    const themeKv = requirement.metadata.find((kv) => kv.key === 'theme');
    const prefKv = requirement.metadata.find((kv) => kv.key === 'preference');
    setTheme(themeKv?.value ?? '');
    setPreference(prefKv?.value ?? '');
  }, [requirement]);

  const effectiveBudget = useMemo(() => {
    if (!requirement) return 0;
    if (budgetOverride === '' || budgetOverride == null) return requirement.budgetAllocated;
    return Number(budgetOverride);
  }, [budgetOverride, requirement]);

  if (!event || !requirement) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Requirement not found
          </Typography>
          <Button variant="contained" onClick={() => navigate(event ? `/events/${event.id}/planner` : '/')}>
            Back
          </Button>
        </Paper>
      </Container>
    );
  }

  async function onSeeMatches() {
    setRequirementBudgetOverride(requirement.id, budgetOverride === '' ? undefined : Number(budgetOverride));
    setRequirementDiyOrHire(requirement.id, mode);

    const metadata = [
      { key: 'theme', value: theme.trim() },
      { key: 'preference', value: preference.trim() },
    ].filter((x) => x.value.length > 0);

    upsertRequirementMetadata(requirement.id, metadata);
    await generateMatchesForRequirement(requirement.id);
    navigate(`/requirements/${requirement.id}/matches`);
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          {requirement.title}
        </Typography>

        {existingShortlist ? (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Currently selected
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {existingShortlist.businessName} • Estimated ${existingShortlist.estimatedPrice.toLocaleString()}
            </Typography>
          </Paper>
        ) : null}

        <Gridish />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Stack spacing={2}>
              <TextField
                label="Budget for this category"
                type="number"
                value={budgetOverride}
                onChange={(e) => setBudgetOverride(e.target.value === '' ? '' : Number(e.target.value))}
                helperText={`Default: $${requirement.budgetAllocated.toLocaleString()}`}
                fullWidth
              />

              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Hire vs DIY
              </Typography>
              <FormControl fullWidth>
                <Select value={mode} onChange={(e) => setMode(e.target.value as 'hire' | 'diy')}>
                  <MenuItem value="hire">Hire a vendor</MenuItem>
                  <MenuItem value="diy">DIY kit / product</MenuItem>
                </Select>
              </FormControl>

              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Requirement details
              </Typography>
              <TextField label="Theme / style" value={theme} onChange={(e) => setTheme(e.target.value)} fullWidth />
              <TextField
                label="Preference (e.g., indoor/outdoor, eggless, vegan...)"
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                fullWidth
              />

              <Button variant="contained" size="large" onClick={onSeeMatches}>
                See Matching Options
              </Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2, width: { xs: '100%', md: 320 } }}>
            <Stack spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Live budget
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Category budget (effective)
              </Typography>
              <Typography variant="h5">${effectiveBudget.toLocaleString()}</Typography>

              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Next: we’ll generate curated businesses and rank them based on:
                </Typography>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  <Typography variant="body2">• budget fit</Typography>
                  <Typography variant="body2">• location</Typography>
                  <Typography variant="body2">• rating</Typography>
                  <Typography variant="body2">• metadata match</Typography>
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    </Container>
  );
}

function Gridish() {
  return null;
}

