interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'An error occurred', onRetry }: ErrorStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-400">
      <div className="text-center">
        <div className="text-4xl mb-2 text-red-500">!</div>
        <p className="mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
