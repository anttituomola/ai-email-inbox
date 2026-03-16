import { EMAIL_FILTER_OPTIONS, SORT_TOGGLE_LABELS, SORT_TOGGLE_TITLES } from '../constants/emailUi';
import type { EmailFilter, EmailListItem, SortOrder } from '../types';
import { formatEmailListTime } from '../utils/emailFormatting';
import { StatusBadge } from './StatusBadge';
import { Tooltip } from './shared/Tooltip';

interface InboxListProps {
  emails: EmailListItem[];
  selectedId: number | null;
  isDashboardSelected: boolean;
  onSelect: (id: number | null) => void;
  filter: EmailFilter;
  onFilterChange: (filter: EmailFilter) => void;
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
}

export function InboxList({
  emails,
  selectedId,
  isDashboardSelected,
  onSelect,
  filter,
  onFilterChange,
  sortOrder,
  onSortChange,
}: InboxListProps) {
  return (
    <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50 shadow-sm z-10">
      {/* Header */}
      <div className="flex flex-col bg-white border-b border-gray-200 h-[116px]">
        <div className="px-5 pt-6 flex items-center justify-between">
          <button 
            onClick={() => onSelect(null)}
            className={`text-lg font-bold hover:text-blue-700 transition-all flex items-center px-3 py-1.5 -ml-3 rounded-md ${isDashboardSelected ? 'text-blue-700 bg-blue-50' : 'text-gray-900 hover:bg-gray-50'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onSortChange(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-md transition-colors"
            title={SORT_TOGGLE_TITLES[sortOrder]}
          >
            <span className="font-medium">Sort:</span>
            {SORT_TOGGLE_LABELS[sortOrder]}
          </button>
        </div>
        
        {/* Filter tabs */}
        <div className="px-5 mt-auto">
          <div className="flex border-b border-gray-200">
            {EMAIL_FILTER_OPTIONS.map((filterOption) => (
              <button
                key={filterOption.value}
                onClick={() => onFilterChange(filterOption.value)}
                className={`flex-1 pb-2.5 text-xs font-medium transition-all text-center border-b-2 -mb-[1px] ${
                  filter === filterOption.value
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No emails to display
          </div>
        ) : (
          emails.map((email) => (
            <button
              key={email.id}
              onClick={() => onSelect(email.id)}
              className={`w-full text-left p-5 border-b border-gray-200 transition-all ${
                selectedId === email.id
                  ? 'bg-blue-50 border-l-4 border-l-blue-600 shadow-inner animate-highlight-pulse'
                  : 'bg-white hover:bg-gray-50 border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-gray-900 truncate">
                  {email.sender_name}
                </span>
                <span className={`text-xs font-medium whitespace-nowrap ml-2 ${email.status !== 'resolved' ? 'text-amber-600' : 'text-gray-500'}`}>
                  {formatEmailListTime(email.received_at, email.status === 'resolved')}
                </span>
              </div>
              <div className="text-sm text-gray-800 font-medium mb-1.5 truncate">
                {email.subject}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 truncate pr-3">
                  {email.preview}
                </span>
                <div className="flex-shrink-0 flex items-center gap-2">
                  {email.has_draft && (
                    <Tooltip content="Draft available">
                      <span
                        className="inline-block h-2 w-2 rounded-full bg-blue-600/80"
                        aria-label="Draft available"
                      />
                    </Tooltip>
                  )}
                  <StatusBadge status={email.status} />
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
