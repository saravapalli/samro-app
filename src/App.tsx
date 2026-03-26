import { BrowserRouter } from 'react-router-dom';
import { PlanningProvider } from './context/PlanningContext';
import { AppRoutes } from './routes/AppRoutes';

export function App() {
  return (
    <PlanningProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </PlanningProvider>
  );
}