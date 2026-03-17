import type {
  AIModelsResponse,
  DemoResetResponse,
  EmailDetail,
  EmailListItem,
  EmailStats,
  EmailStatus,
  GenerateDraftResponse,
  NextEmailResponse,
  OpenDraftGenerationEvent,
  ReviewDraftResponse,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

export const api = {
  // Email list
  getEmails: (status?: EmailStatus) => 
    fetchAPI<EmailListItem[]>(`/emails${status ? `?status=${status}` : ''}`),
  
  // Email detail
  getEmail: (id: number) => 
    fetchAPI<EmailDetail>(`/emails/${id}`),

  // Get stats
  getStats: () =>
    fetchAPI<EmailStats>('/emails/stats'),
  
  // Update status
  updateStatus: (id: number, status: EmailStatus) => 
    fetchAPI<EmailDetail>(`/emails/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  
  // Save draft
  saveDraft: (id: number, draft_text: string) => 
    fetchAPI<EmailDetail>(`/drafts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ draft_text }),
    }),
  
  // Send reply
  sendReply: (id: number, reply_text: string) => 
    fetchAPI<EmailDetail>(`/drafts/${id}/send`, {
      method: 'POST',
      body: JSON.stringify({ reply_text }),
    }),

  // Undo send reply
  undoSendReply: (id: number, previous_status: EmailStatus) =>
    fetchAPI<EmailDetail>(`/drafts/${id}/undo-send`, {
      method: 'POST',
      body: JSON.stringify({ previous_status }),
    }),
  
  // Send and get next
  sendAndNext: (id: number, reply_text: string) => 
    fetchAPI<NextEmailResponse>(`/drafts/${id}/send-and-next`, {
      method: 'POST',
      body: JSON.stringify({ reply_text }),
    }),
  
  // Generate AI draft
  generateDraft: (email_id: number, model: string, signal?: AbortSignal) => 
    fetchAPI<GenerateDraftResponse>('/ai/generate-draft', {
      method: 'POST',
      body: JSON.stringify({ email_id, model }),
      signal,
    }),

  // Review existing draft
  reviewDraft: (email_id: number, draft_text: string, signal?: AbortSignal) =>
    fetchAPI<ReviewDraftResponse>('/ai/review-draft', {
      method: 'POST',
      body: JSON.stringify({ email_id, draft_text }),
      signal,
    }),

  // AI model config
  getAIModels: () => fetchAPI<AIModelsResponse>('/ai/models'),

  // Reset demo state
  resetDemoData: () =>
    fetchAPI<DemoResetResponse>('/admin/reset-demo', {
      method: 'POST',
    }),

  // Generate drafts for all open emails and stream progress
  generateOpenDraftsStream: async (
    onEvent: (event: OpenDraftGenerationEvent) => void,
    signal?: AbortSignal
  ) => {
    const response = await fetch(`${API_BASE}/ai/generate-open-drafts/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
      signal,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Streaming is not supported by this browser.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          continue;
        }
        onEvent(JSON.parse(trimmedLine) as OpenDraftGenerationEvent);
      }
    }

    const lastLine = buffer.trim();
    if (lastLine) {
      onEvent(JSON.parse(lastLine) as OpenDraftGenerationEvent);
    }
  },
};
