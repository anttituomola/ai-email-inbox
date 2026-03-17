import type { ReactNode, MouseEventHandler } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: ReactNode;
  subtitle?: string;
  icon: LucideIcon;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  animationDelay?: string;
  valueClassName?: string;
  rightElement?: ReactNode;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  onClick,
  animationDelay = '0ms',
  valueClassName = '',
  rightElement,
}: StatCardProps) {
  const isClickable = !!onClick;

  const cardContent = (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 text-gray-500 ${isClickable ? 'group-hover:text-blue-500' : ''} transition-colors`} />
        <h3 className="font-semibold text-gray-500 uppercase text-xs tracking-wider">{title}</h3>
        {rightElement}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-3xl font-light ${valueClassName || 'text-gray-900'}`}>{value}</span>
        {subtitle && <span className="text-sm text-gray-500">{subtitle}</span>}
      </div>
    </>
  );

  const baseClasses =
    'bg-white rounded-lg shadow-sm p-6 border border-gray-300 animate-fade-in';

  if (isClickable) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} text-left hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group`}
        style={{ animationDelay }}
      >
        {cardContent}
      </button>
    );
  }

  return (
    <div className={baseClasses} style={{ animationDelay }}>
      {cardContent}
    </div>
  );
}
