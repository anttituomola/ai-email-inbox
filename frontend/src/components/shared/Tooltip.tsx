import type { ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: string;
}

const positionClasses = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
};

export function Tooltip({
  children,
  content,
  position = 'bottom',
  maxWidth = 'max-w-xs',
}: TooltipProps) {
  return (
    <span className="relative inline-flex items-center justify-center group">
      {children}
      <span
        className={`pointer-events-none absolute ${positionClasses[position]} z-10 w-max ${maxWidth} rounded-md bg-white border border-gray-200 px-4 py-3 text-left text-xs normal-case tracking-normal text-gray-600 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100`}
      >
        {content}
      </span>
    </span>
  );
}

interface InfoTooltipProps {
  content: readonly string[];
}

export function InfoTooltip({ content }: InfoTooltipProps) {
  return (
    <Tooltip
      content={
        <>
          {content.map((paragraph, index) => (
            <span
              key={paragraph}
              className={`block ${index < content.length - 1 ? 'mb-2' : ''}`}
            >
              {paragraph}
            </span>
          ))}
        </>
      }
    >
      <button
        type="button"
        className="group inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 text-[11px] font-semibold text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
        aria-label={content.join(' ')}
      >
        i
      </button>
    </Tooltip>
  );
}
