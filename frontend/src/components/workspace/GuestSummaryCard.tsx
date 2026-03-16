import type { GuestProfile } from '../../types';

interface GuestSummaryCardProps {
  guest: GuestProfile;
}

export function GuestSummaryCard({ guest }: GuestSummaryCardProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-semibold text-sm">
        {guest.name.charAt(0)}
      </div>
      <div className="flex-1">
        <div className="font-medium text-gray-900 text-sm">{guest.name}</div>
        <div className="text-sm text-gray-500">{guest.email}</div>
      </div>
    </div>
  );
}
