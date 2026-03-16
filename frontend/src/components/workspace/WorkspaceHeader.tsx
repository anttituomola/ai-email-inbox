import type { EmailDetail } from '../../types';
import { formatWorkspaceDate } from '../../utils/emailFormatting';
import { StatusBadge } from '../StatusBadge';

interface WorkspaceHeaderProps {
  email: EmailDetail;
}

export function WorkspaceHeader({ email }: WorkspaceHeaderProps) {
  return (
    <div className="border-b border-gray-200 px-6 py-6 bg-white min-h-[116px] flex flex-col justify-center">
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-xl font-bold text-gray-900 leading-tight">{email.subject}</h2>
        <StatusBadge status={email.status} />
      </div>
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <span>Received: {formatWorkspaceDate(email.received_at)}</span>
      </div>
    </div>
  );
}
