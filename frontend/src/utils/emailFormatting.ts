import type { EmailListItem, SortOrder } from '../types';

function parseBackendDate(dateStr: string): Date {
  const looksTimezoneAware = /[zZ]|[+-]\d{2}:\d{2}$/.test(dateStr);
  return new Date(looksTimezoneAware ? dateStr : `${dateStr}Z`);
}

export function sortEmailsByReceivedAt(emails: EmailListItem[], sortOrder: SortOrder): EmailListItem[] {
  return [...emails].sort((a, b) => {
    const timeA = parseBackendDate(a.received_at).getTime();
    const timeB = parseBackendDate(b.received_at).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });
}

export function formatWorkspaceDate(dateStr: string): string {
  const date = parseBackendDate(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function formatEmailListTime(dateStr: string, isResolved: boolean): string {
  const date = parseBackendDate(dateStr);

  if (isResolved) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    return `${diffInMinutes}m`;
  }

  if (diffInHours < 48) {
    return `${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d`;
}

export function formatHandlingTime(minutes: number | null): string {
  if (minutes === null) {
    return 'N/A';
  }

  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return `${hours}h ${remainingMinutes}m`;
}
