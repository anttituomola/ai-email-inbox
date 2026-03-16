import type { GenerateDraftResponse } from '../../types';
import { ReviewChecklist } from '../ReviewChecklist';

interface WorkspaceReviewPanelProps {
  hasDraft: boolean;
  draftResponse: GenerateDraftResponse | null;
  isLoading?: boolean;
}

export function WorkspaceReviewPanel({ hasDraft, draftResponse, isLoading = false }: WorkspaceReviewPanelProps) {
  return (
    <div className="w-80 border-l border-gray-200 bg-white p-6 overflow-y-auto shadow-sm z-10">
      <div className="mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Review Checklist
        </h3>
      </div>
      <ReviewChecklist hasDraft={hasDraft} draftResponse={draftResponse} isLoading={isLoading} />
    </div>
  );
}
