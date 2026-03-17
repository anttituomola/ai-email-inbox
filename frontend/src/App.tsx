import { useCallback, useEffect, useState } from 'react';
import { ReviewerLandingPage } from './components/ReviewerLandingPage';
import { InboxApp } from './components/InboxApp';
import { api } from './api';

const APP_PATH = '/app';

function resolveRoute(pathname: string) {
  return pathname === APP_PATH || pathname.startsWith(`${APP_PATH}/`) ? 'app' : 'landing';
}

function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthResolved, setIsAuthResolved] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!api.hasStoredSession()) {
      setIsAuthenticated(false);
      setIsAuthResolved(true);
      return;
    }

    api.checkSession()
      .then((session) => {
        setIsAuthenticated(session.authenticated);
        if (!session.authenticated) {
          api.clearStoredSession();
        }
      })
      .catch(() => {
        api.clearStoredSession();
        setIsAuthenticated(false);
      })
      .finally(() => {
        setIsAuthResolved(true);
      });
  }, []);

  const navigate = useCallback((path: string) => {
    if (window.location.pathname === path) {
      return;
    }

    window.history.pushState({}, '', path);
    setCurrentPath(path);
  }, []);

  const handleAuthChange = useCallback((authenticated: boolean) => {
    setIsAuthenticated(authenticated);
    setIsAuthResolved(true);
  }, []);

  if (!isAuthResolved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    resolveRoute(currentPath) === 'app' && isAuthenticated
      ? <InboxApp onExitApp={() => navigate('/')} />
      : <ReviewerLandingPage
          onOpenApp={() => navigate(APP_PATH)}
          isAuthenticated={isAuthenticated}
          onAuthChange={handleAuthChange}
        />
  );
}

export default App;
