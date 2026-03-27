import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import SendRounded from '@mui/icons-material/SendRounded';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getApiBase, postAgentSuggestions } from '../../api/client';
import { buildMockSuggestions, parseNaturalLanguage, type PlanningSuggestion } from '../../api/suggestionEngine';
import { usePlanning } from '../../context/PlanningContext';

function deriveGuideHeadline(
  pathname: string,
  suggestions: PlanningSuggestion[],
  requirementsCount: number,
  doneCount: number,
): { headline: string; sub: string } {
  if (pathname.includes('/review')) {
    return {
      headline: 'Review everything before you reach out.',
      sub: 'Fix gaps or adjust picks—then head to Contact when you’re ready.',
    };
  }
  if (pathname.includes('/contact')) {
    return {
      headline: 'Almost there—message your shortlist.',
      sub: 'Add a short note per vendor so they know what you need.',
    };
  }
  if (pathname.includes('/matches')) {
    return {
      headline: 'Compare options and pick one vendor.',
      sub: 'Tap a card for details, then Select to lock this category.',
    };
  }
  if (pathname.includes('/requirements/') && !pathname.includes('/matches')) {
    return {
      headline: 'Dial in this category.',
      sub: 'Budget, DIY vs hire, and style notes help us rank better matches.',
    };
  }
  if (pathname.includes('/setup')) {
    return {
      headline: 'Lock in the basics.',
      sub: 'Date, place, and guest count set the tone for the rest of your plan.',
    };
  }
  if (pathname.includes('/planner')) {
    return {
      headline: 'Work categories in order—required first.',
      sub: `${doneCount}/${requirementsCount} categories have a vendor. Finish required items before optional ones.`,
    };
  }
  const first = suggestions[0];
  if (first) {
    return {
      headline: 'Here’s what to do next',
      sub: first.text,
    };
  }
  return {
    headline: 'Your planning assistant',
    sub: 'Pick an action below or ask a question.',
  };
}

export function SuggestionPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { event, requirements, shortlistedMatchByRequirementId, serverEventContext } = usePlanning();

  const [nl, setNl] = useState('');
  const [nlSuggestions, setNlSuggestions] = useState<PlanningSuggestion[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState<PlanningSuggestion | null>(null);
  /** Updates when user taps an option—shows immediate feedback before navigation. */
  const [pickEcho, setPickEcho] = useState<string | null>(null);

  const requirementIdParam = params.requirementId ? Number(params.requirementId) : undefined;

  const baseSuggestions = useMemo(
    () =>
      buildMockSuggestions({
        event,
        requirements,
        shortlistedMatchByRequirementId,
        pathname: location.pathname,
        serverContext: serverEventContext,
        currentRequirementId: requirementIdParam,
      }),
    [event, requirements, shortlistedMatchByRequirementId, location.pathname, serverEventContext, requirementIdParam],
  );

  const displaySuggestions = nlSuggestions.length > 0 ? nlSuggestions : baseSuggestions;

  const doneCount = useMemo(
    () => requirements.filter((r) => shortlistedMatchByRequirementId[r.id]).length,
    [requirements, shortlistedMatchByRequirementId],
  );

  const autoGuide = useMemo(
    () =>
      deriveGuideHeadline(location.pathname, displaySuggestions, requirements.length, doneCount),
    [location.pathname, displaySuggestions, requirements.length, doneCount],
  );

  useEffect(() => {
    setPickEcho(null);
  }, [location.pathname, shortlistedMatchByRequirementId, requirements.length]);

  const headline = pickEcho ? 'Nice choice' : autoGuide.headline;
  const sub = pickEcho ?? autoGuide.sub;

  const applySuggestion = useCallback(
    (s: PlanningSuggestion) => {
      if (!event) return;
      const short = s.text.length > 90 ? `${s.text.slice(0, 87)}…` : s.text;
      setPickEcho(`Next: ${short}`);
      const { action } = s;
      if (action.type === 'set_budget_hint') {
        setPending(s);
        setConfirmOpen(true);
        return;
      }
      if (action.type === 'navigate_requirement' && action.requirementId) {
        window.setTimeout(() => navigate(`/events/${event.id}/requirements/${action.requirementId}`), 120);
        return;
      }
      if (action.type === 'navigate_planner') {
        window.setTimeout(() => navigate(`/events/${event.id}/planner`), 120);
        return;
      }
      if (action.type === 'navigate_review') {
        window.setTimeout(() => navigate(`/events/${event.id}/review`), 120);
        return;
      }
      if (action.type === 'navigate_contact') {
        window.setTimeout(() => navigate(`/events/${event.id}/contact`), 120);
        return;
      }
      if (action.type === 'navigate_matches' && action.requirementId) {
        window.setTimeout(() => navigate(`/requirements/${action.requirementId}/matches`), 120);
      }
    },
    [event, navigate],
  );

  async function onAsk() {
    const text = nl.trim();
    if (!text) return;
    const parsed = parseNaturalLanguage(text);
    let extra: PlanningSuggestion[] = [];
    if (parsed.maybeRequirementTitle) {
      const matchReq = requirements.find((r) =>
        r.title.toLowerCase().includes(parsed.maybeRequirementTitle!.toLowerCase()),
      );
      if (matchReq && event) {
        extra.push({
          id: 'nl-match',
          text: `Open “${matchReq.title}” to add details and find vendors.`,
          action: { type: 'navigate_requirement', requirementId: matchReq.id, eventId: event.id },
        });
      }
    }

    let server: PlanningSuggestion[] = [];
    if (getApiBase() && event) {
      server = await postAgentSuggestions({
        eventId: event.id,
        userMessage: text,
        pageContext: location.pathname,
      });
    }

    setNlSuggestions([...extra, ...server, ...baseSuggestions].slice(0, 8));
    setPickEcho(`You asked about “${text.slice(0, 48)}${text.length > 48 ? '…' : ''}”—here are tailored options below.`);
  }

  if (!event) return null;

  return (
    <>
      <Card
        elevation={0}
        sx={{
          mb: 2,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          backgroundImage: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.06))',
        }}
      >
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <AutoAwesomeRounded sx={{ color: 'secondary.main', mt: 0.25 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="overline" color="secondary" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
                  Guide
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
                  {headline}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {sub}
                </Typography>
              </Box>
              {getApiBase() ? (
                <Chip size="small" label="Live API" color="success" variant="outlined" />
              ) : (
                <Chip size="small" label="Local" variant="outlined" />
              )}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                fullWidth
                placeholder="Ask anything…"
                value={nl}
                onChange={(e) => setNl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void onAsk();
                }}
              />
              <Button variant="contained" onClick={() => void onAsk()} disabled={!nl.trim()} sx={{ minWidth: 44, px: 1.5 }}>
                <SendRounded fontSize="small" />
              </Button>
            </Stack>

            <Collapse in={displaySuggestions.length > 0}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Tap an option—it updates the guide above, then takes you there.
              </Typography>
              <Stack direction="row" flexWrap="wrap" sx={{ gap: 1 }}>
                {displaySuggestions.map((s) => (
                  <Button
                    key={s.id}
                    variant="outlined"
                    size="small"
                    onClick={() => applySuggestion(s)}
                    sx={{
                      borderRadius: 99,
                      textTransform: 'none',
                      borderColor: 'secondary.light',
                      animation: 'fadeIn 0.35s ease-out',
                      '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } },
                    }}
                  >
                    {s.text.length > 72 ? `${s.text.slice(0, 69)}…` : s.text}
                  </Button>
                ))}
              </Stack>
            </Collapse>

            {nlSuggestions.length > 0 ? (
              <Button size="small" onClick={() => setNlSuggestions([])}>
                Clear question — restore auto guide
              </Button>
            ) : null}
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Budget tip</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{pending?.text}</Typography>
          <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
            This is guidance only—your totals stay under your control.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Close</Button>
          {event ? (
            <Button variant="contained" onClick={() => navigate(`/events/${event.id}/planner`)}>
              Go to planner
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </>
  );
}
