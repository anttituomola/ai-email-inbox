import type { ReviewItem, GenerateDraftResponse } from '../types';

interface ReviewChecklistProps {
  hasDraft: boolean;
  draftResponse?: GenerateDraftResponse | null;
  isLoading?: boolean;
}

export function ReviewChecklist({ hasDraft, draftResponse, isLoading = false }: ReviewChecklistProps) {
  if (!hasDraft) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 text-center text-gray-500 text-sm shadow-sm">
        Generate or write a draft to enable AI review.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600 shadow-sm">
        Loading AI review...
      </div>
    );
  }

  // If draft was written manually (not AI-generated), show a simple message
  if (!draftResponse) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600 shadow-sm">
        AI review is only available for generated drafts.
      </div>
    );
  }

  const unansweredQuestions = draftResponse.unanswered_questions;
  const warningItems: ReviewItem[] = draftResponse.review_items.filter(
    (item) => item.type !== 'unanswered_question'
  );
  const hasIssues = unansweredQuestions.length > 0 || warningItems.length > 0;

  return (
    <div className="space-y-4">
      {/* What still needs attention */}
      {hasIssues && (
        <div className="space-y-3">
          {/* Unanswered questions */}
          {unansweredQuestions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Could not answer
              </h4>
              <div className="space-y-2">
                {unansweredQuestions.map((question, index) => (
                  <div key={`${question}-${index}`} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm border-l-4 border-l-amber-400">
                    <p className="text-sm text-gray-800">{question}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warningItems.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Please review
              </h4>
              <div className="space-y-2">
                {warningItems.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm border-l-4 border-l-amber-400">
                    <p className="text-sm text-gray-800">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* All good message */}
      {!hasIssues && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-5 text-sm text-green-800 shadow-sm font-medium">
          The draft answers the guest&apos;s questions with no outstanding review issues.
        </div>
      )}
    </div>
  );
}
