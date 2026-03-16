interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastMessage {
  id: number;
  message: string;
  action?: ToastAction;
  isExiting?: boolean;
}

interface ToastStackProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes toast-enter {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes toast-exit {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(6px);
          }
        }
      `}</style>
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-lg border border-blue-200 bg-blue-50 px-5 py-4 shadow-lg"
          style={{
            animation: toast.isExiting
              ? 'toast-exit 180ms ease-in forwards'
              : 'toast-enter 180ms ease-out',
          }}
        >
          <div className="flex items-start gap-3">
            <p className="flex-1 text-sm text-gray-800">{toast.message}</p>
            {toast.action ? (
              <button
                type="button"
                onClick={toast.action.onClick}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {toast.action.label}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-sm text-blue-300 transition-colors hover:text-blue-500"
              aria-label="Dismiss notification"
            >
              x
            </button>
          </div>
        </div>
      ))}
      </div>
    </>
  );
}
