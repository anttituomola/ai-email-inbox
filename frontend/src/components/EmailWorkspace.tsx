import { useEffect, useMemo, useState } from 'react';
import debounce from 'lodash.debounce';
import { api } from '../api';
import { individualDraftGenerationManager } from '../services/individualDraftGenerationManager.ts';
import { openDraftGenerationManager } from '../services/openDraftGenerationManager.ts';
import type { EmailDetail, EmailStatus, GenerateDraftResponse } from '../types';
import { DraftReplyPanel } from './workspace/DraftReplyPanel';
import { GuestSummaryCard } from './workspace/GuestSummaryCard';
import { WorkspaceHeader } from './workspace/WorkspaceHeader';
import { WorkspaceReviewPanel } from './workspace/WorkspaceReviewPanel';

interface EmailWorkspaceProps {
  email: EmailDetail | null;
  onEmailUpdate: (email: EmailDetail) => void;
  onNextEmail: (email: EmailDetail) => void;
  onEmailSent: () => void;
  onSelectNextOpenEmail: (excludeEmailId: number) => Promise<boolean>;
  onUndoSentEmail: (email: EmailDetail) => void;
  onShowToast: (
    message: string,
    options?: {
      action?: {
        label: string;
        onClick: () => void | Promise<void>;
      };
      duration?: number;
    }
  ) => void;
  onReturnToDashboard: () => void;
}

type EditorMode = 'preview' | 'edit';
const FALLBACK_OPENAI_MODEL_OPTIONS = ['gpt-5', 'gpt-5-mini', 'gpt-5-nano'] as const;
const FALLBACK_DEFAULT_OPENAI_MODEL = 'gpt-5-nano';

export function EmailWorkspace({
  email,
  onEmailUpdate,
  onNextEmail,
  onEmailSent,
  onSelectNextOpenEmail,
  onUndoSentEmail,
  onShowToast,
  onReturnToDashboard,
}: EmailWorkspaceProps) {
  const [draft, setDraft] = useState(email?.draft_text || '');
  const [draftResponse, setDraftResponse] = useState<GenerateDraftResponse | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>(email?.draft_text ? 'preview' : 'edit');
  const [generationSeconds, setGenerationSeconds] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [modelOptions, setModelOptions] = useState<string[]>([...FALLBACK_OPENAI_MODEL_OPTIONS]);
  const [selectedModel, setSelectedModel] = useState<string>(FALLBACK_DEFAULT_OPENAI_MODEL);
  const [error, setError] = useState<string | null>(null);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [generationState, setGenerationState] = useState(individualDraftGenerationManager.getState());

  // Reset workspace state when switching to a different email.
  useEffect(() => {
    if (!email?.id) {
      return;
    }

    setDraft(email.draft_text || '');
    setDraftResponse(null);
    setEditorMode(email.draft_text ? 'preview' : 'edit');
    setError(null);
    setIsReviewLoading(false);
  }, [email?.id]);

  // Keep the current email's draft in sync without resetting the full workspace state.
  useEffect(() => {
    if (!email?.id) {
      return;
    }

    setDraft(email.draft_text || '');
    setDraftResponse(null);
  }, [email?.id, email?.draft_text]);

  useEffect(() => {
    return individualDraftGenerationManager.subscribe(setGenerationState);
  }, []);

  useEffect(() => {
    return individualDraftGenerationManager.subscribeEvents((event) => {
      if (!email?.id || event.emailId !== email.id) {
        return;
      }

      if (event.type === 'completed') {
        setDraftResponse(event.response);
        setDraft(event.response.draft_text);
        setEditorMode('preview');
        setError(null);
        return;
      }

      if (event.type === 'failed') {
        setError(event.error);
      }
    });
  }, [email?.id]);

  useEffect(() => {
    const loadReviewForExistingDraft = async () => {
      if (!email?.id) {
        return;
      }

      const existingDraft = email.draft_text?.trim();
      if (!existingDraft || draftResponse !== null) {
        return;
      }

      const cachedIndividualReview = individualDraftGenerationManager.getResponseForEmail(email.id);
      if (cachedIndividualReview) {
        setDraftResponse({
          ...cachedIndividualReview,
          draft_text: email.draft_text,
        });
        return;
      }

      const cachedBulkReview = openDraftGenerationManager.getReviewForEmail(email.id);
      if (cachedBulkReview) {
        setDraftResponse({
          ...cachedBulkReview,
          draft_text: email.draft_text,
        });
        return;
      }

      try {
        setIsReviewLoading(true);
        const reviewResponse = await api.reviewDraft(email.id, email.draft_text);
        setDraftResponse({
          draft_text: email.draft_text,
          citations: reviewResponse.citations,
          unanswered_questions: reviewResponse.unanswered_questions,
          review_items: reviewResponse.review_items,
        });
      } catch {
        // Keep checklist minimal if review fetch fails.
      } finally {
        setIsReviewLoading(false);
      }
    };

    void loadReviewForExistingDraft();
  }, [email?.id, email?.draft_text, draftResponse]);

  useEffect(() => {
    const loadModelConfig = async () => {
      try {
        const modelConfig = await api.getAIModels();
        if (modelConfig.models.length > 0) {
          setModelOptions(modelConfig.models);
        }
        setSelectedModel(modelConfig.default_model);
      } catch {
        setModelOptions([...FALLBACK_OPENAI_MODEL_OPTIONS]);
        setSelectedModel(FALLBACK_DEFAULT_OPENAI_MODEL);
      }
    };

    void loadModelConfig();
  }, []);

  useEffect(() => {
    const isGeneratingCurrentEmail = generationState.isRunning && generationState.emailId === email?.id;
    if (!isGeneratingCurrentEmail || !generationState.startedAt) {
      setGenerationSeconds(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setGenerationSeconds((performance.now() - generationState.startedAt!) / 1000);
    }, 100);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [email?.id, generationState.emailId, generationState.isRunning, generationState.startedAt]);

  const debouncedSaveDraft = useMemo(
    () =>
      debounce(async (emailId: number, newDraft: string) => {
        try {
          const updated = await api.saveDraft(emailId, newDraft);
          onEmailUpdate(updated);
        } catch {
          // Silent fail - draft is still in local state
        }
      }, 1000),
    [onEmailUpdate]
  );

  useEffect(() => {
    return () => {
      debouncedSaveDraft.flush();
    };
  }, [debouncedSaveDraft, email?.id]);

  if (!email) {
    return <div className="flex-1 bg-white" />;
  }

  const handleGenerateDraft = async () => {
    if (!email?.id) {
      return;
    }

    const didStart = individualDraftGenerationManager.start(email.id, selectedModel);
    if (!didStart) {
      setError('Draft generation already in progress.');
      return;
    }

    setError(null);
  };

  const handleCancelGeneration = () => {
    individualDraftGenerationManager.cancel();
    setError(null);
  };

  const handleDraftChange = (newDraft: string) => {
    setDraft(newDraft);
    debouncedSaveDraft(email.id, newDraft);
  };

  const showUndoToast = (emailId: number, previousStatus: EmailStatus) => {
    onShowToast('Email sent.', {
      action: {
        label: 'Undo send',
        onClick: async () => {
          const undoneEmail = await api.undoSendReply(emailId, previousStatus);
          onUndoSentEmail(undoneEmail);
          onShowToast('Send undone.');
        },
      },
      duration: 5000,
    });
  };

  const executeSendWorkflow = async (
    sendFn: () => Promise<void>,
    onSuccess: () => void
  ) => {
    if (!draft.trim()) {
      setError('Please write a reply before sending');
      return;
    }

    debouncedSaveDraft.cancel();
    setIsSending(true);
    setError(null);

    try {
      await sendFn();
      onSuccess();
    } catch {
      setError('Failed to send reply. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async () => {
    const previousStatus = email.status;
    await executeSendWorkflow(
      async () => {
        const updated = await api.sendReply(email.id, draft);
        onEmailUpdate(updated);
        onEmailSent();
        showUndoToast(email.id, previousStatus);
      },
      () => {}
    );
  };

  const handleSendAndNext = async () => {
    const previousStatus = email.status;
    await executeSendWorkflow(
      async () => {
        const result = await api.sendAndNext(email.id, draft);
        onEmailSent();
        showUndoToast(email.id, previousStatus);

        if (result.has_next && result.email) {
          onNextEmail(result.email);
        } else {
          onReturnToDashboard();
        }
      },
      () => {}
    );
  };

  const handleStatusChange = async (status: EmailStatus) => {
    try {
      const updated = await api.updateStatus(email.id, status);

      if (status === 'needs_review') {
        onShowToast('Marked for review.');
        const hasNext = await onSelectNextOpenEmail(email.id);
        if (!hasNext) {
            onEmailUpdate(updated);
        }
      } else if (status === 'open') {
        onShowToast('Reopened email.');
        onEmailUpdate(updated);
      } else {
        onEmailUpdate(updated);
      }
    } catch {
      setError('Failed to update status');
    }
  };

  const isResolved = email.status === 'resolved';
  const isGenerating = generationState.isRunning && generationState.emailId === email.id;
  // Use citations from the initial AI generation (no revalidation after edits)
  const activeCitations = draftResponse?.citations ?? [];
  const hasDraft = draft.trim().length > 0;

  return (
    <div key={email.id} className="flex-1 flex flex-col bg-white z-0 animate-fade-in-right">
      <WorkspaceHeader email={email} />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-gray-300 bg-white">
            <GuestSummaryCard guest={email.guest} />
            <div className="mt-6 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {email.body}
            </div>
          </div>

          <DraftReplyPanel
            activeCitations={activeCitations}
            draft={draft}
            editorMode={editorMode}
            email={email}
            error={error}
            generationSeconds={generationSeconds}
            isGenerating={isGenerating}
            isSending={isSending}
            modelOptions={modelOptions}
            selectedModel={selectedModel}
            onDraftChange={handleDraftChange}
            onEditorModeChange={setEditorMode}
            onCancelGeneration={handleCancelGeneration}
            onGenerateDraft={handleGenerateDraft}
            onModelChange={setSelectedModel}
            onSend={handleSend}
            onSendAndNext={handleSendAndNext}
            onStatusChange={handleStatusChange}
          />
        </div>

        {!isResolved && (
          <WorkspaceReviewPanel
            hasDraft={hasDraft}
            draftResponse={draftResponse}
            isLoading={isReviewLoading}
          />
        )}
      </div>
    </div>
  );
}