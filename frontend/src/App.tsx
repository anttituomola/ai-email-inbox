import { useCallback, useRef, useState } from 'react';
import { InboxList } from './components/InboxList';
import { EmailWorkspace } from './components/EmailWorkspace';
import { Dashboard } from './components/Dashboard';
import { ToastStack, type ToastMessage } from './components/ToastStack';
import { useInboxController } from './hooks/useInboxController';

interface ShowToastOptions {
  action?: {
    label: string;
    onClick: () => void | Promise<void>;
  };
  duration?: number;
}

function App() {
  const {
    error,
    filter,
    handleEmailSent,
    handleEmailUpdate,
    handleNextEmail,
    handleSelectNextOpenEmail,
    handleUndoSentEmail,
    handleSelect,
    handleStartHandling,
    isLoading,
    selectedEmail,
    setFilter,
    setSortOrder,
    sortOrder,
    sortedEmails,
    view,
  } = useInboxController();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextToastIdRef = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts((currentToasts) =>
      currentToasts.map((toast) =>
        toast.id === id ? { ...toast, isExiting: true } : toast
      )
    );

    window.setTimeout(() => {
      setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
    }, 180);
  }, []);

  const showToast = useCallback((message: string, options?: ShowToastOptions) => {
    const id = nextToastIdRef.current++;
    setToasts((currentToasts) => [
      ...currentToasts,
      {
        id,
        message,
        action: options?.action
          ? {
              label: options.action.label,
              onClick: () => {
                dismissToast(id);
                void options.action?.onClick();
              },
            }
          : undefined,
      },
    ]);

    window.setTimeout(() => {
      dismissToast(id);
    }, options?.duration ?? 3000);
  }, [dismissToast]);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Error banner */}
      {error && (
        <div className="bg-red-100 border-b border-red-200 p-3">
          <div className="text-red-700 text-sm text-center">{error}</div>
        </div>
      )}

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        <InboxList
          emails={sortedEmails}
          selectedId={selectedEmail?.id || null}
          isDashboardSelected={view === 'dashboard'}
          onSelect={handleSelect}
          filter={filter}
          onFilterChange={setFilter}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
        />

        {view === 'dashboard' ? (
          <Dashboard onStartHandling={handleStartHandling} onNavigateToFilter={setFilter} />
        ) : (
          <EmailWorkspace
            email={selectedEmail}
            onEmailUpdate={handleEmailUpdate}
            onNextEmail={handleNextEmail}
            onEmailSent={handleEmailSent}
            onSelectNextOpenEmail={handleSelectNextOpenEmail}
            onUndoSentEmail={handleUndoSentEmail}
            onShowToast={showToast}
            onReturnToDashboard={() => handleSelect(null)}
          />
        )}
      </div>

      {/* Loading overlay */}
      {isLoading && sortedEmails.length === 0 && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      )}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
