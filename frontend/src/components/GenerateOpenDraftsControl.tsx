import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { openDraftGenerationManager } from '../services/openDraftGenerationManager';
import { Button } from './shared';

interface GenerateOpenDraftsControlProps {
  showButton: boolean;
  onCompleted: () => void | Promise<void>;
}

export function GenerateOpenDraftsControl({
  showButton,
  onCompleted,
}: GenerateOpenDraftsControlProps) {
  const [generationState, setGenerationState] = useState(openDraftGenerationManager.getState());
  const [pendingDraftGenerationCount, setPendingDraftGenerationCount] = useState<number | null>(null);
  const wasRunningRef = useRef(generationState.isRunning);

  useEffect(() => openDraftGenerationManager.subscribe(setGenerationState), []);

  useEffect(() => {
    if (wasRunningRef.current && !generationState.isRunning) {
      void onCompleted();
    }
    wasRunningRef.current = generationState.isRunning;
  }, [generationState.isRunning, onCompleted]);

  const handleGenerateDraftsForOpenEmails = async () => {
    if (generationState.isRunning) {
      return;
    }

    openDraftGenerationManager.resetMessage();

    try {
      const openEmails = await api.getEmails('open');
      const openWithoutDraftCount = openEmails.filter((email) => !email.has_draft).length;

      if (openWithoutDraftCount === 0) {
        setGenerationState((current) => ({
          ...current,
          progress: null,
          message: 'No open emails without drafts.',
        }));
        return;
      }

      setPendingDraftGenerationCount(openWithoutDraftCount);
    } catch {
      setGenerationState((current) => ({
        ...current,
        message: 'Failed to prepare draft generation.',
      }));
    }
  };

  const handleConfirmGenerateDrafts = async () => {
    if (generationState.isRunning || pendingDraftGenerationCount === null) {
      return;
    }

    setPendingDraftGenerationCount(null);
    void openDraftGenerationManager.start();
  };

  return (
    <>
      <div className="flex flex-col items-end gap-2">
        {showButton && (
          <button
            onClick={
              generationState.isRunning
                ? () => openDraftGenerationManager.stop()
                : handleGenerateDraftsForOpenEmails
            }
            className={`px-4 py-2.5 border text-sm font-medium rounded-md shadow-sm transition-colors ${
              generationState.isRunning
                ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {generationState.isRunning && generationState.progress
              ? `Stop generating (${generationState.progress.processed}/${generationState.progress.total})`
              : 'Generate Drafts for Open'}
          </button>
        )}
      </div>

      {pendingDraftGenerationCount !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/30 px-4">
          <div className="w-full max-w-sm rounded-lg border border-gray-300 bg-white p-5 shadow-xl">
            <p className="text-sm text-gray-800">
              Generate draft responses for {pendingDraftGenerationCount} open email
              {pendingDraftGenerationCount === 1 ? '' : 's'}?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPendingDraftGenerationCount(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmGenerateDrafts}
              >
                Generate
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
