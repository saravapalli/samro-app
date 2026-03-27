import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { fetchEventPlanningContext, getApiBase } from '../api/client';
import {
  EVENT_TYPES,
  mockAutoGenerateRequirements,
  mockCreateDraftEvent,
  mockCreateLeadFromMatch,
  mockGenerateMatches,
  mockShortlistMatch,
} from '../api/mockApi';
import type { ServerEventContext } from '../api/suggestionEngine';

export type EventTypeOption = { id: number; name: string; description?: string };

export type EventDraft = {
  id: number;
  userId: number;
  eventTypeId: number;
  title: string;
  location: string;
  budget: number;
  guestCount: number;
  eventDate: string; // YYYY-MM-DD (spec)
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type PlanningRequirement = {
  id: number;
  eventId: number;
  businessTypeId: number;
  title: string;
  budgetAllocated: number;
  status: string;
  required: boolean;
  priorityWeight: number;
  metadata: { key: string; value: string }[];
  diyOrHire: 'hire' | 'diy';
  userBudgetOverride?: number;
};

export type Business = {
  id: number;
  name: string;
  description: string;
  location: string;
  rating: number;
};

export type BusinessMatch = {
  id: number;
  requirementId: number;
  businessId: number;
  businessName: string;
  matchScore: number;
  estimatedPrice: number;
  reasoning: string;
  status: 'suggested' | 'viewed' | 'shortlisted' | 'rejected';
};

type LeadStatus = 'sent' | 'viewed' | 'responded' | 'booked' | 'closed';
export type Lead = {
  id: number;
  matchId: number;
  status: LeadStatus;
  message: string;
};

type PlanningContextValue = {
  eventTypes: EventTypeOption[];
  event: EventDraft | null;
  requirements: PlanningRequirement[];
  matchesByRequirementId: Record<number, BusinessMatch[]>;
  shortlistedMatchByRequirementId: Record<number, BusinessMatch | undefined>;
  leads: Lead[];

  createDraftEvent: (input: {
    eventTypeId: number;
    title: string;
    location: string;
    budget: number;
    guestCount: number;
    eventDate: string;
    userId: number;
  }) => Promise<number>;

  updateEventSetup: (input: Partial<Omit<EventDraft, 'id' | 'userId'>>) => void;
  autoGenerateRequirements: () => Promise<void>;
  generateMatchesForRequirement: (requirementId: number) => Promise<void>;
  shortlistMatch: (matchId: number) => Promise<void>;
  removeShortlist: (requirementId: number) => void;
  upsertRequirementMetadata: (requirementId: number, kvs: { key: string; value: string }[]) => void;
  setRequirementDiyOrHire: (requirementId: number, mode: 'hire' | 'diy') => void;
  setRequirementBudgetOverride: (requirementId: number, budget: number | undefined) => void;
  contactShortlisted: (input: { requirementId: number; message: string }[]) => Promise<void>;

  /** When VITE_API_BASE is set, last snapshot from GET /events/{id}/context */
  serverEventContext: ServerEventContext | null;
  refreshServerEventContext: () => Promise<void>;
};

const PlanningContext = createContext<PlanningContextValue | null>(null);

export function PlanningProvider({ children }: { children: ReactNode }) {
  // MVP assumption: user already exists; we keep a mock userId here.
  const [event, setEvent] = useState<EventDraft | null>(null);
  const [requirements, setRequirements] = useState<PlanningRequirement[]>([]);
  const [matchesByRequirementId, setMatchesByRequirementId] = useState<Record<number, BusinessMatch[]>>(
    {},
  );
  const [shortlistedMatchByRequirementId, setShortlistedMatchByRequirementId] = useState<
    Record<number, BusinessMatch | undefined>
  >({});
  const [leads, setLeads] = useState<Lead[]>([]);
  const [serverEventContext, setServerEventContext] = useState<ServerEventContext | null>(null);

  const refreshServerEventContext = useCallback(async () => {
    if (!getApiBase() || !event?.id) {
      setServerEventContext(null);
      return;
    }
    const ctx = await fetchEventPlanningContext(event.id);
    setServerEventContext(ctx);
  }, [event?.id]);

  useEffect(() => {
    void refreshServerEventContext();
  }, [refreshServerEventContext]);

  const createDraftEvent = useCallback(async (input: {
    eventTypeId: number;
    title: string;
    location: string;
    budget: number;
    guestCount: number;
    eventDate: string;
    userId: number;
  }) => {
    const created = await mockCreateDraftEvent(input);
    setEvent(created);
    setRequirements([]);
    setMatchesByRequirementId({});
    setShortlistedMatchByRequirementId({});
    setLeads([]);
    return created.id;
  }, []);

  const updateEventSetup = useCallback((input: Partial<Omit<EventDraft, 'id' | 'userId'>>) => {
    setEvent((prev) => {
      if (!prev) return prev;
      return { ...prev, ...input, updatedAt: new Date().toISOString() };
    });
  }, []);

  const autoGenerateRequirements = useCallback(async () => {
    if (!event) return;
    const reqs = await mockAutoGenerateRequirements({
      eventId: event.id,
      eventTypeId: event.eventTypeId,
      budget: event.budget,
    });
    setRequirements(reqs);
    setMatchesByRequirementId({});
    setShortlistedMatchByRequirementId({});
  }, [event]);

  const generateMatchesForRequirement = useCallback(async (requirementId: number) => {
    const req = requirements.find((r) => r.id === requirementId);
    if (!req) return;

    const matches = await mockGenerateMatches({
      requirementId,
      requirementTitle: req.title,
      requirementBudget: req.userBudgetOverride ?? req.budgetAllocated,
    });

    setMatchesByRequirementId((prev) => ({
      ...prev,
      [requirementId]: matches,
    }));
    // When generating matches, unset shortlist for a fresh start (user can still reselect).
    setShortlistedMatchByRequirementId((prev) => ({ ...prev, [requirementId]: undefined }));
  }, [requirements]);

  const shortlistMatch = useCallback(async (matchId: number) => {
    let reqId: number | null = null;
    let picked: BusinessMatch | undefined;
    for (const [k, list] of Object.entries(matchesByRequirementId)) {
      const m = list.find((x) => x.id === matchId);
      if (m) {
        reqId = Number(k);
        picked = m;
        break;
      }
    }
    if (reqId == null || !picked) return;

    const snapshotMatches = matchesByRequirementId;
    const snapshotShort = shortlistedMatchByRequirementId;

    setMatchesByRequirementId((prev) => {
      const list = prev[reqId!] ?? [];
      return {
        ...prev,
        [reqId!]: list.map((m) => ({
          ...m,
          status: m.id === matchId ? 'shortlisted' : m.status === 'shortlisted' ? 'suggested' : m.status,
        })),
      };
    });
    setShortlistedMatchByRequirementId((prev) => ({
      ...prev,
      [reqId!]: { ...picked!, status: 'shortlisted' },
    }));

    try {
      await mockShortlistMatch({ matchId });
    } catch (e) {
      setMatchesByRequirementId(snapshotMatches);
      setShortlistedMatchByRequirementId(snapshotShort);
      throw e;
    }
  }, [matchesByRequirementId, shortlistedMatchByRequirementId]);

  const removeShortlist = useCallback((requirementId: number) => {
    setShortlistedMatchByRequirementId((prev) => ({ ...prev, [requirementId]: undefined }));
    setMatchesByRequirementId((prev) => {
      const list = prev[requirementId];
      if (!list) return prev;
      return {
        ...prev,
        [requirementId]: list.map((m) => (m.status === 'shortlisted' ? { ...m, status: 'suggested' } : m)),
      };
    });
  }, []);

  const upsertRequirementMetadata = useCallback((requirementId: number, kvs: { key: string; value: string }[]) => {
    setRequirements((prev) =>
      prev.map((r) => (r.id === requirementId ? { ...r, metadata: kvs } : r)),
    );
  }, []);

  const setRequirementDiyOrHire = useCallback((requirementId: number, mode: 'hire' | 'diy') => {
    setRequirements((prev) => prev.map((r) => (r.id === requirementId ? { ...r, diyOrHire: mode } : r)));
  }, []);

  const setRequirementBudgetOverride = useCallback((requirementId: number, budget: number | undefined) => {
    setRequirements((prev) =>
      prev.map((r) => (r.id === requirementId ? { ...r, userBudgetOverride: budget } : r)),
    );
  }, []);

  const contactShortlisted = useCallback(
    async (input: { requirementId: number; message: string }[]) => {
      const created: Lead[] = [];
      let nextLeadId = leads.length + 1;

      for (const item of input) {
        const match = shortlistedMatchByRequirementId[item.requirementId];
        if (!match) continue;

        await mockCreateLeadFromMatch({ matchId: match.id, message: item.message });
        created.push({
          id: nextLeadId++,
          matchId: match.id,
          status: 'sent',
          message: item.message,
        });
      }

      setLeads((prev) => [...prev, ...created]);
    },
    [leads.length, shortlistedMatchByRequirementId],
  );

  const value = useMemo<PlanningContextValue>(
    () => ({
      eventTypes: EVENT_TYPES,
      event,
      requirements,
      matchesByRequirementId,
      shortlistedMatchByRequirementId,
      leads,
      createDraftEvent,
      updateEventSetup,
      autoGenerateRequirements,
      generateMatchesForRequirement,
      shortlistMatch,
      removeShortlist,
      upsertRequirementMetadata,
      setRequirementDiyOrHire,
      setRequirementBudgetOverride,
      contactShortlisted,
      serverEventContext,
      refreshServerEventContext,
    }),
    [
      autoGenerateRequirements,
      contactShortlisted,
      createDraftEvent,
      event,
      generateMatchesForRequirement,
      leads,
      matchesByRequirementId,
      removeShortlist,
      requirements,
      refreshServerEventContext,
      serverEventContext,
      setRequirementDiyOrHire,
      setRequirementBudgetOverride,
      shortlistedMatchByRequirementId,
      shortlistMatch,
      updateEventSetup,
      upsertRequirementMetadata,
    ],
  );

  return <PlanningContext.Provider value={value}>{children}</PlanningContext.Provider>;
}

export function usePlanning() {
  const ctx = useContext(PlanningContext);
  if (!ctx) throw new Error('usePlanning must be used within PlanningProvider');
  return ctx;
}