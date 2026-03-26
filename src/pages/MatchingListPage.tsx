import { Box, Button, Card, Container, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material';
import { CircularProgress } from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BusinessDetailDialog } from '../components/business/BusinessDetailDialog';
import { BusinessCard } from '../components/business/BusinessCard';
import { usePlanning } from '../context/PlanningContext';

export function MatchingListPage() {
  const navigate = useNavigate();
  const params = useParams();
  const requirementId = params.requirementId ? Number(params.requirementId) : undefined;

  const { event, requirements, matchesByRequirementId, shortlistedMatchByRequirementId, shortlistMatch, generateMatchesForRequirement } =
    usePlanning();

  const requirement = requirements.find((r) => r.id === requirementId);
  const matches = requirementId ? matchesByRequirementId[requirementId] ?? [] : [];

  const [minRating, setMinRating] = useState<number>(4.0);
  const [maxPrice, setMaxPrice] = useState<number>(200000);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailMatchId, setDetailMatchId] = useState<number | null>(null);
  const [selectingMatchId, setSelectingMatchId] = useState<number | null>(null);
  const [applyingFilters, setApplyingFilters] = useState(false);

  const filtered = useMemo(() => {
    return matches
      .filter((m) => m.estimatedPrice <= maxPrice)
      .filter((m) => {
        // Match rating is not directly returned in mock matches; use matchScore as a proxy.
        return m.matchScore >= (minRating / 10);
      });
  }, [matches, maxPrice, minRating]);

  const selectedMatch = requirementId ? shortlistedMatchByRequirementId[requirementId] : undefined;

  const detailMatch = detailMatchId ? matches.find((m) => m.id === detailMatchId) : undefined;

  if (!event || !requirementId || !requirement) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Matches not found
          </Typography>
          <Button variant="contained" onClick={() => navigate(event ? `/events/${event.id}/planner` : '/')}>
            Back
          </Button>
        </Paper>
      </Container>
    );
  }

  async function onSelectMatch(matchId: number) {
    setSelectingMatchId(matchId);
    try {
      await shortlistMatch(matchId);
      if (event) navigate(`/events/${event.id}/planner`);
    } finally {
      setSelectingMatchId(null);
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              {requirement.title} options
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Category budget: ${((requirement.userBudgetOverride ?? requirement.budgetAllocated) as number).toLocaleString()}
            </Typography>
          </Box>

          <Stack spacing={1} alignItems="flex-end">
            {selectedMatch ? (
              <Paper sx={{ p: 1.5 }}>
                <Typography variant="body2">
                  Selected: <strong>{selectedMatch.businessName}</strong>
                </Typography>
              </Paper>
            ) : null}
            <Button variant="outlined" onClick={() => navigate(`/events/${event.id}/planner`)}>
              Back to planner
            </Button>
          </Stack>
        </Stack>

        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Min rating (approx)"
                type="number"
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Max price"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => {
                  setApplyingFilters(true);
                  window.setTimeout(() => setApplyingFilters(false), 350);
                }}
                disabled={applyingFilters}
              >
                {applyingFilters ? <CircularProgress size={20} color="inherit" /> : 'Apply filters'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={2}>
          {filtered.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                No matches for your current filters.
              </Typography>
            </Grid>
          ) : null}

          {filtered.map((m) => (
            <Grid item xs={12} md={6} lg={4} key={m.id}>
              <BusinessCard
                match={m}
                reasoning={m.reasoning}
                onSelect={() => onSelectMatch(m.id)}
                selectLoading={selectingMatchId === m.id}
                onViewDetails={() => {
                  setDetailMatchId(m.id);
                  setDetailOpen(true);
                }}
              />
            </Grid>
          ))}
        </Grid>

        <BusinessDetailDialog
          open={detailOpen}
          match={detailMatch}
          onClose={() => setDetailOpen(false)}
          onSelect={() => {
            if (!detailMatch) return;
            setDetailOpen(false);
            onSelectMatch(detailMatch.id);
          }}
          selectLoading={selectingMatchId === detailMatch?.id}
        />
      </Stack>
    </Container>
  );
}

