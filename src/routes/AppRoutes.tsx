import { Navigate, Route, Routes } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { EventSetupPage } from '../pages/EventSetupPage';
import { PlannerDashboardPage } from '../pages/PlannerDashboardPage';
import { RequirementSetupPage } from '../pages/RequirementSetupPage';
import { MatchingListPage } from '../pages/MatchingListPage';
import { FinalReviewPage } from '../pages/FinalReviewPage';
import { ContactVendorsPage } from '../pages/ContactVendorsPage';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/events/:eventId/setup" element={<EventSetupPage />} />
        <Route path="/events/:eventId/planner" element={<PlannerDashboardPage />} />
        <Route
          path="/events/:eventId/requirements/:requirementId"
          element={<RequirementSetupPage />}
        />
        <Route path="/requirements/:requirementId/matches" element={<MatchingListPage />} />
        <Route path="/events/:eventId/review" element={<FinalReviewPage />} />
        <Route path="/events/:eventId/contact" element={<ContactVendorsPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}