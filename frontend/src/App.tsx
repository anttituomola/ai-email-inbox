import { useCallback, useEffect, useState } from 'react';
import { ReviewerLandingPage } from './components/ReviewerLandingPage';
import { InboxApp } from './components/InboxApp';

const APP_PATH = '/app';

function resolveRoute(pathname: string) {
  return pathname === APP_PATH || pathname.startsWith(`${APP_PATH}/`) ? 'app' : 'landing';
}

function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((path: string) => {
    if (window.location.pathname === path) {
      return;
    }

    window.history.pushState({}, '', path);
    setCurrentPath(path);
  }, []);

  return (
    resolveRoute(currentPath) === 'app'
      ? <InboxApp onExitApp={() => navigate('/')} />
      : <ReviewerLandingPage onOpenApp={() => navigate(APP_PATH)} />
  );
}

export default App;
