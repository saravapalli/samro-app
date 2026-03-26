import { PlanningProvider } from './context/PlanningContext';
import { AppRoutes } from './routes/AppRoutes';

export function App() {
  return (
    <PlanningProvider>
      <AppRoutes />
    </PlanningProvider>
  );
}