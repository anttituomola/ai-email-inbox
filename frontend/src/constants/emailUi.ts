import type { EmailFilter, EmailStatus, SortOrder } from '../types';

export const DEFAULT_EMAIL_FILTER: EmailFilter = 'open';
export const DEFAULT_SORT_ORDER: SortOrder = 'asc';

export const EMAIL_FILTER_OPTIONS: Array<{ value: EmailFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'needs_review', label: 'Needs Review' },
  { value: 'resolved', label: 'Resolved' },
];

export const EMAIL_STATUS_LABELS: Record<EmailStatus, string> = {
  open: 'Open',
  needs_review: 'Needs Review',
  resolved: 'Resolved',
};

export const EMAIL_STATUS_BADGE_STYLES: Record<EmailStatus, string> = {
  open: 'bg-blue-50 text-blue-700 border border-blue-200',
  needs_review: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  resolved: 'bg-green-50 text-green-700 border border-green-200',
};

export const SORT_TOGGLE_LABELS: Record<SortOrder, string> = {
  desc: '↓ Newest',
  asc: '↑ Oldest',
};

export const SORT_TOGGLE_TITLES: Record<SortOrder, string> = {
  desc: 'Newest first',
  asc: 'Oldest first',
};
