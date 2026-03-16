import { useEffect, useRef, useState } from 'react';
import type { Citation, EmailDetail } from '../../types';
import { formatWorkspaceDate } from '../../utils/emailFormatting';
import { DraftPreview } from './DraftPreview';

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M9 5H5" />
      <path d="M19 15v4" />
      <path d="M15 17h4" />
    </svg>
  );
}

type EditorMode = 'preview' | 'edit';

interface DraftReplyPanelProps {
  activeCitations: Citation[];
  draft: string;
  editorMode: EditorMode;
  email: EmailDetail;
  error: string | null;
  generationSeconds: number;
  isGenerating: boolean;
  isSending: boolean;
  modelOptions: readonly string[];
  selectedModel: string;
  onDraftChange: (value: string) => void;
  onEditorModeChange: (mode: EditorMode) => void;
  onCancelGeneration: () => void;
  onGenerateDraft: () => void;
  onModelChange: (model: string) => void;
  onSend: () => void;
  onSendAndNext: () => void;
  onStatusChange: (status: EmailDetail['status']) => void;
}

export function DraftReplyPanel({
  activeCitations,
  draft,
  editorMode,
  email,
  error,
  generationSeconds,
  isGenerating,
  isSending,
  modelOptions,
  selectedModel,
  onDraftChange,
  onEditorModeChange,
  onCancelGeneration,
  onGenerateDraft,
  onModelChange,
  onSend,
  onSendAndNext,
  onStatusChange,
}: DraftReplyPanelProps) {
  const isResolved = email.status === 'resolved';
  const hasDraft = draft.trim().length > 0;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (editorMode === 'edit' && !isResolved && !isGenerating) {
      textareaRef.current?.focus();
    }
  }, [editorMode, isResolved, isGenerating, email.id]);

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {isResolved ? 'Sent Reply' : 'Reply Draft'}
        </h3>
        {!isResolved && (
          <div className="flex items-center gap-2">
            {hasDraft && (
              <div className="inline-flex rounded-md border border-gray-200 p-1 text-sm bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => onEditorModeChange('preview')}
                  className={`rounded-sm px-4 py-1.5 font-medium transition-colors ${
                    editorMode === 'preview'
                      ? 'bg-gray-100 text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => onEditorModeChange('edit')}
                  className={`rounded-sm px-4 py-1.5 font-medium transition-colors ${
                    editorMode === 'edit'
                      ? 'bg-gray-100 text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Edit
                </button>
              </div>
            )}
            <button
              onClick={onGenerateDraft}
              disabled={isGenerating}
              className={`px-5 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors relative inline-grid [font-variant-numeric:tabular-nums] ${!hasDraft && !isGenerating ? 'animate-button-attention' : ''}`}
            >
              <span className="invisible col-start-1 row-start-1">Generating 000.0s</span>
              <span className="col-start-1 row-start-1">
                {isGenerating ? `Generating ${generationSeconds.toFixed(1)}s` : 'Generate Draft'}
              </span>
            </button>
            {!isGenerating && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className={`p-2 rounded-md border border-gray-300 bg-white shadow-sm hover:bg-gray-50 transition-colors ${isModelDropdownOpen ? 'text-blue-600' : 'text-gray-600'}`}
                  aria-label="Select AI model"
                  title={`Model: ${selectedModel}`}
                >
                  <SparklesIcon className="w-5 h-5" />
                </button>
                {isModelDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-1">
                      AI Model
                    </div>
                    {modelOptions.map((model) => (
                      <button
                        key={model}
                        onClick={() => {
                          onModelChange(model);
                          setIsModelDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                          selectedModel === model ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {model}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {isGenerating && (
              <button
                type="button"
                onClick={onCancelGeneration}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>

      {isResolved ? (
        <div className="bg-gray-50 p-5 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Sent reply:</div>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">{email.sent_reply}</div>
        </div>
      ) : editorMode === 'preview' ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Hover highlighted claims to see the supporting source.</span>
            <span>
              {activeCitations.length} source{activeCitations.length === 1 ? '' : 's'}
            </span>
          </div>
          <DraftPreview
            text={draft}
            citations={activeCitations}
            onEdit={() => onEditorModeChange('edit')}
          />
        </div>
      ) : (
        <div className="space-y-2">
          {activeCitations.length > 0 && (
            <div className="text-xs text-gray-500">
              Switch to Preview to inspect the source for each highlighted claim.
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            disabled={isGenerating}
            placeholder="Click 'Generate Draft' to get AI assistance, or write your reply here..."
            className="w-full h-64 p-5 border border-gray-300 rounded-lg resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm transition-shadow text-gray-800 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          />
        </div>
      )}

      {!isResolved && (
        <>
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
              {error}
            </div>
          )}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={onSend}
              disabled={isGenerating || isSending || !draft.trim()}
              className="px-6 py-2.5 bg-gray-800 text-white text-sm font-medium rounded-md shadow-sm hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
            <button
              onClick={onSendAndNext}
              disabled={isGenerating || isSending || !draft.trim()}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSending ? 'Sending...' : 'Send & Next →'}
            </button>

            <div className="flex-1"></div>

            <button
              onClick={() => onStatusChange(email.status === 'needs_review' ? 'open' : 'needs_review')}
              disabled={isGenerating || isSending}
              className={`px-6 py-2.5 text-sm font-medium rounded-md border transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                email.status === 'needs_review'
                  ? 'bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 bg-white shadow-sm'
              }`}
            >
              {email.status === 'needs_review' ? 'Reopen Email' : 'Mark Needs Review'}
            </button>
          </div>
        </>
      )}

      {isResolved && (
        <div className="border-t border-gray-200 p-4 bg-gray-50 mt-6 -mx-6 -mb-6">
          <div className="text-sm text-gray-600 text-center">
            This email has been resolved. Sent on{' '}
            {formatWorkspaceDate(email.sent_at || email.received_at)}
          </div>
        </div>
      )}
    </div>
  );
}
