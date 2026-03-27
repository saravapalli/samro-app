import type { EventDraft, PlanningRequirement, BusinessMatch } from '../context/PlanningContext';

export type SuggestionActionType =
  | 'navigate_planner'
  | 'navigate_requirement'
  | 'navigate_matches'
  | 'navigate_review'
  | 'navigate_contact'
  | 'set_budget_hint'
  | 'none';

const ACTION_TYPES: SuggestionActionType[] = [
  'navigate_planner',
  'navigate_requirement',
  'navigate_matches',
  'navigate_review',
  'navigate_contact',
  'set_budget_hint',
  'none',
];

export function normalizeActionType(t: string): SuggestionActionType {
  return ACTION_TYPES.includes(t as SuggestionActionType) ? (t as SuggestionActionType) : 'none';
}

export type PlanningSuggestion = {
  id: string;
  text: string;
  rationale?: string;
  action: { type: SuggestionActionType; requirementId?: number; eventId?: number; hint?: string };
};

export type ServerEventContext = {
  title?: string;
  location?: string;
  budget?: number;
  guestCount?: number;
  requirements?: { id: number; title: string; shortlisted: boolean; selectedVendor?: string }[];
};

/** Deterministic suggestions from current planning state (works offline). */
export function buildMockSuggestions(input: {
  event: EventDraft | null;
  requirements: PlanningRequirement[];
  shortlistedMatchByRequirementId: Record<number, BusinessMatch | undefined>;
  pathname: string;
  serverContext?: ServerEventContext | null;
  /** When on a requirement setup route */
  currentRequirementId?: number;
}): PlanningSuggestion[] {
  const { event, requirements, shortlistedMatchByRequirementId, pathname, serverContext, currentRequirementId } = input;
  const out: PlanningSuggestion[] = [];

  const reqSorted = [...requirements].sort((a, b) => {
    if (a.required !== b.required) return a.required ? -1 : 1;
    return (b.priorityWeight ?? 0) - (a.priorityWeight ?? 0);
  });

  const next =
    reqSorted.find((r) => r.required && !shortlistedMatchByRequirementId[r.id]) ??
    reqSorted.find((r) => !shortlistedMatchByRequirementId[r.id]) ??
    null;

  const ctxTitle = serverContext?.title ?? event?.title;
  const ctxBudget = serverContext?.budget ?? event?.budget;

  if (next && event) {
    out.push({
      id: 'next-cat',
      text: `Continue with “${next.title}”—we’ll match vendors to your budget and style.`,
      rationale: 'Prioritizes required categories, then optional ones.',
      action: { type: 'navigate_requirement', requirementId: next.id, eventId: event.id },
    });
  }

  if (event && pathname.includes('/planner') && reqSorted.some((r) => shortlistedMatchByRequirementId[r.id])) {
    out.push({
      id: 'review',
      text: 'Review your selections and budget before contacting vendors.',
      action: { type: 'navigate_review', eventId: event.id },
    });
  }

  if (event && ctxBudget != null && ctxBudget > 0) {
    const allocated = requirements.reduce((s, r) => s + (r.userBudgetOverride ?? r.budgetAllocated), 0);
    if (allocated > ctxBudget * 1.05) {
      out.push({
        id: 'budget-over',
        text: `Category budgets add up to more than your total ($${allocated.toLocaleString()} vs $${ctxBudget.toLocaleString()}). Consider trimming optional categories.`,
        action: { type: 'set_budget_hint', hint: 'review_allocations' },
      });
    }
  }

  if (event && pathname.includes('/requirements/') && !pathname.includes('/matches') && currentRequirementId) {
    out.push({
      id: 'see-matches',
      text: 'When you’re ready, tap “See Matching Options” to compare ranked vendors for this category.',
      action: { type: 'navigate_matches', requirementId: currentRequirementId },
    });
  }

  if (!out.length && event) {
    out.push({
      id: 'welcome',
      text: ctxTitle
        ? `Planning “${ctxTitle}”: add details per category so we can surface better matches.`
        : 'Tell us your preferences per category—we use them to rank vendors and explain each match.',
      action: { type: 'navigate_planner', eventId: event.id },
    });
  }

  return out.slice(0, 5);
}

/** Lightweight NL → structured hint + optional suggestion filter (confirm for destructive ops). */
export function parseNaturalLanguage(input: string): {
  summary: string;
  keywords: string[];
  maybeRequirementTitle?: string;
} {
  const t = input.toLowerCase().trim();
  const keywords: string[] = [];
  if (/\b(budget|afford|cost|cheap|expensive)\b/.test(t)) keywords.push('budget');
  if (/\b(next|continue|start)\b/.test(t)) keywords.push('flow');
  if (/\b(photo|picture|camera)\b/.test(t)) keywords.push('photography');
  if (/\b(cake|dessert)\b/.test(t)) keywords.push('cake');
  if (/\b(venue|location|place)\b/.test(t)) keywords.push('venue');
  let maybeRequirementTitle: string | undefined;
  if (keywords.includes('cake')) maybeRequirementTitle = 'Cake';
  if (keywords.includes('photography')) maybeRequirementTitle = 'Photography';
  if (keywords.includes('venue')) maybeRequirementTitle = 'Venue';
  return { summary: input.slice(0, 200), keywords, maybeRequirementTitle };
}
