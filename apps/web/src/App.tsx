import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AppRouter } from './router/AppRouter';

export const App = () => {
  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  );
};
