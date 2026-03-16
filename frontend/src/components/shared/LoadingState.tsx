interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4 border-b-2',
  md: 'h-8 w-8 border-b-2',
  lg: 'h-12 w-12 border-b-2',
};

export function LoadingState({ message = 'Loading...', size = 'md' }: LoadingStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-400">
      <div className="text-center">
        <div
          className={`animate-spin rounded-full ${sizeClasses[size]} border-gray-900 mx-auto mb-4`}
        />
        <p>{message}</p>
      </div>
    </div>
  );
}
