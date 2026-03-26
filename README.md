# samroUI

Material UI (MUI) mock UI for the `samro` event planning assistant.

## Tech

- React + TypeScript
- Vite
- Material UI (MUI)
- React Router

## Local setup

1. Install dependencies:
   - `npm install`
2. Run:
   - `npm run dev`
3. Open:
   - `http://localhost:5173`

## Mocked backend

The UI uses `src/api/mockApi.ts` and `src/context/PlanningContext.tsx` to provide interactive data.
Later, swap these mock functions with real calls to the `samro` backend endpoints.

## Guided flow routes

- `/` Landing / event start
- `/events/:eventId/setup` Event setup
- `/events/:eventId/planner` Planner dashboard
- `/events/:eventId/requirements/:requirementId` Requirement setup
- `/requirements/:requirementId/matches` Matching list
- `/events/:eventId/review` Final review
- `/events/:eventId/contact` Contact vendors

