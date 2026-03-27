import type { PlanningSuggestion, ServerEventContext } from './suggestionEngine';
import { normalizeActionType } from './suggestionEngine';

export function getApiBase(): string {
  const v = import.meta.env.VITE_API_BASE as string | undefined;
  return (v && v.replace(/\/$/, '')) || '';
}

export async function fetchEventPlanningContext(eventId: number): Promise<ServerEventContext | null> {
  const base = getApiBase();
  if (!base) return null;
  const res = await fetch(`${base}/events/${eventId}/context`);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    title?: string;
    location?: string;
    budget?: number;
    guestCount?: number;
    requirements?: {
      id: number;
      title: string;
      shortlisted: boolean;
      selectedVendorName?: string | null;
    }[];
  };
  return {
    title: data.title,
    location: data.location,
    budget: data.budget != null ? Number(data.budget) : undefined,
    guestCount: data.guestCount,
    requirements: data.requirements?.map((r) => ({
      id: r.id,
      title: r.title,
      shortlisted: r.shortlisted,
      selectedVendor: r.selectedVendorName ?? undefined,
    })),
  };
}

type AgentSuggestionItem = {
  id: string;
  text: string;
  rationale?: string;
  actionType: string;
  requirementId?: number;
  eventId?: number;
  hint?: string;
};

export async function postAgentSuggestions(input: {
  eventId?: number;
  userMessage: string;
  pageContext?: string;
}): Promise<PlanningSuggestion[]> {
  const base = getApiBase();
  if (!base) return [];
  const res = await fetch(`${base}/agent/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: input.eventId ?? null,
      userMessage: input.userMessage,
      pageContext: input.pageContext ?? null,
    }),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { suggestions?: AgentSuggestionItem[] };
  const list = data.suggestions ?? [];
  return list.map((s) => mapServerItem(s));
}

function mapServerItem(s: AgentSuggestionItem): PlanningSuggestion {
  const type = normalizeActionType(s.actionType ?? 'none');
  return {
    id: s.id,
    text: s.text,
    rationale: s.rationale,
    action: {
      type,
      requirementId: s.requirementId,
      eventId: s.eventId,
      hint: s.hint,
    },
  };
}
