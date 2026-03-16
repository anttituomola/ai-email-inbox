import { EMAIL_STATUS_BADGE_STYLES, EMAIL_STATUS_LABELS } from '../constants/emailUi';
import type { EmailStatus } from '../types';

interface StatusBadgeProps {
  status: EmailStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${EMAIL_STATUS_BADGE_STYLES[status]}`}>
      {EMAIL_STATUS_LABELS[status]}
    </span>
  );
}
