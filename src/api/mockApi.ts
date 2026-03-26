/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  Business,
  BusinessMatch,
  EventDraft,
  EventTypeOption,
  PlanningRequirement,
} from '../context/PlanningContext';

// Simple deterministic mock data so the UI can be interactive immediately.
// Later, swap these with real fetch calls to the `samro` backend.

let nextId = 100;

export const EVENT_TYPES: EventTypeOption[] = [
  { id: 1, name: 'birthday', description: 'Birthday celebration' },
  { id: 2, name: 'wedding', description: 'Wedding celebration' },
  { id: 3, name: 'baby_shower', description: 'Baby shower celebration' },
  { id: 4, name: 'corporate', description: 'Corporate event' },
  { id: 5, name: 'graduation', description: 'Graduation celebration' },
];

export function mockCreateDraftEvent(input: {
  eventTypeId: number;
  title: string;
  location: string;
  budget: number;
  guestCount: number;
  eventDate: string;
  userId: number;
}): Promise<EventDraft> {
  const eventId = nextId++;
  return Promise.resolve({
    id: eventId,
    userId: input.userId,
    eventTypeId: input.eventTypeId,
    title: input.title,
    location: input.location,
    budget: input.budget,
    guestCount: input.guestCount,
    eventDate: input.eventDate,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function mockAutoGenerateRequirements(input: {
  eventId: number;
  eventTypeId: number;
  budget: number;
}): Promise<PlanningRequirement[]> {
  // MVP scope: keep it small and curated.
  const budget = input.budget ?? 0;

  const base = (() => {
    switch (input.eventTypeId) {
      case 1: // birthday
        return [
          { businessTypeId: 2, title: 'Cake', required: true, priorityWeight: 5 },
          { businessTypeId: 3, title: 'Decoration', required: true, priorityWeight: 4 },
          { businessTypeId: 4, title: 'Venue', required: false, priorityWeight: 3 },
          { businessTypeId: 5, title: 'Photography', required: false, priorityWeight: 2 },
          { businessTypeId: 6, title: 'Entertainment', required: false, priorityWeight: 1 },
        ];
      case 2: // wedding
        return [
          { businessTypeId: 7, title: 'Catering', required: true, priorityWeight: 5 },
          { businessTypeId: 8, title: 'Venue', required: true, priorityWeight: 4 },
          { businessTypeId: 9, title: 'Decoration', required: false, priorityWeight: 3 },
          { businessTypeId: 10, title: 'Photography', required: false, priorityWeight: 3 },
          { businessTypeId: 11, title: 'Entertainment', required: false, priorityWeight: 2 },
        ];
      case 3: // baby shower
        return [
          { businessTypeId: 12, title: 'Cake / Treats', required: true, priorityWeight: 5 },
          { businessTypeId: 13, title: 'Decoration', required: true, priorityWeight: 4 },
          { businessTypeId: 14, title: 'Venue', required: false, priorityWeight: 3 },
          { businessTypeId: 15, title: 'Photography', required: false, priorityWeight: 2 },
        ];
      case 4: // corporate
        return [
          { businessTypeId: 16, title: 'Venue', required: true, priorityWeight: 5 },
          { businessTypeId: 17, title: 'Catering', required: true, priorityWeight: 4 },
          { businessTypeId: 18, title: 'AV / Rentals', required: false, priorityWeight: 3 },
          { businessTypeId: 19, title: 'Entertainment', required: false, priorityWeight: 2 },
          { businessTypeId: 20, title: 'Branding / Decor', required: false, priorityWeight: 1 },
        ];
      case 5: // graduation
        return [
          { businessTypeId: 21, title: 'Celebration Cake', required: true, priorityWeight: 5 },
          { businessTypeId: 22, title: 'Decoration', required: true, priorityWeight: 4 },
          { businessTypeId: 23, title: 'Venue', required: false, priorityWeight: 3 },
          { businessTypeId: 24, title: 'Photography', required: false, priorityWeight: 2 },
          { businessTypeId: 25, title: 'Activities / Props', required: false, priorityWeight: 1 },
        ];
      default:
        return [
          { businessTypeId: 2, title: 'Cake', required: true, priorityWeight: 5 },
          { businessTypeId: 3, title: 'Decoration', required: true, priorityWeight: 4 },
          { businessTypeId: 4, title: 'Venue', required: false, priorityWeight: 3 },
        ];
    }
  })();

  const totalWeight = base.reduce((sum, x) => sum + x.priorityWeight, 0) || 1;

  return Promise.resolve(
    base.map((x, idx) => ({
      id: nextId++,
      eventId: input.eventId,
      businessTypeId: x.businessTypeId,
      title: x.title,
      budgetAllocated: Math.round((budget * x.priorityWeight) / totalWeight),
      status: 'open',
      required: x.required,
      priorityWeight: x.priorityWeight,
      metadata: [],
      diyOrHire: 'hire',
      userBudgetOverride: undefined,
    })),
  );
}

export function mockGenerateMatches(input: {
  requirementId: number;
  requirementTitle: string;
  requirementBudget: number;
}): Promise<BusinessMatch[]> {
  const reqId = input.requirementId;
  const title = input.requirementTitle;
  const budget = input.requirementBudget ?? 0;

  const makeBusiness = (i: number): Business => {
    const id = nextId + i;
    const rating = 3.8 + (i % 5) * 0.2;
    return {
      id,
      name: `${title} Option ${i + 1}`,
      description: `Curated ${title.toLowerCase()} choice with strong reviews.`,
      location: 'Jersey City',
      rating,
    };
  };

  const options = [0.9, 0.85, 0.8, 0.75, 0.7].map((s, i) => {
    const estimated = Math.round(budget * (0.5 + i * 0.12));
    return {
      id: nextId++,
      requirementId: reqId,
      businessId: nextId++,
      businessName: `${title} Option ${i + 1}`,
      matchScore: s,
      estimatedPrice: estimated,
      reasoning: 'Fits your budget and matches the likely preferences for this category.',
      status: 'suggested',
    } as BusinessMatch;
  });

  return Promise.resolve(options);
}

export function mockShortlistMatch(input: { matchId: number }): Promise<void> {
  return Promise.resolve();
}

export function mockCreateLeadFromMatch(input: { matchId: number; message: string }): Promise<void> {
  // In a real implementation, you would call:
  // POST /matches/{matchId}/lead
  return Promise.resolve();
}
