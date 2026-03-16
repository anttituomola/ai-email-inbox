import { api } from '../api';
import type { GenerateDraftResponse, OpenDraftGenerationEvent } from '../types';

interface DraftGenerationProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  lastSubject: string;
  lastError: string | null;
  isDone: boolean;
}

export interface OpenDraftGenerationState {
  isRunning: boolean;
  progress: DraftGenerationProgress | null;
  message: string | null;
}

type Listener = (state: OpenDraftGenerationState) => void;
type EventListener = (event: OpenDraftGenerationEvent) => void;

let state: OpenDraftGenerationState = {
  isRunning: false,
  progress: null,
  message: null,
};

let abortController: AbortController | null = null;
const listeners = new Set<Listener>();
const eventListeners = new Set<EventListener>();
const reviewByEmailId = new Map<number, GenerateDraftResponse>();

function emit() {
  for (const listener of listeners) {
    listener(state);
  }
}

function setState(patch: Partial<OpenDraftGenerationState>) {
  state = { ...state, ...patch };
  emit();
}

function emitEvent(event: OpenDraftGenerationEvent) {
  for (const listener of eventListeners) {
    listener(event);
  }
}

function applyEvent(event: OpenDraftGenerationEvent) {
  emitEvent(event);

  if (event.type === 'start') {
    setState({
      progress: {
        total: event.total,
        processed: 0,
        succeeded: 0,
        failed: 0,
        lastSubject: '',
        lastError: null,
        isDone: event.total === 0,
      },
    });
    return;
  }

  if (event.type === 'progress') {
    if (event.ok && event.review) {
      reviewByEmailId.set(event.email_id, {
        draft_text: '',
        citations: event.review.citations,
        unanswered_questions: event.review.unanswered_questions,
        review_items: event.review.review_items,
      });
    }

    const base = state.progress ?? {
      total: event.total,
      processed: 0,
      succeeded: 0,
      failed: 0,
      lastSubject: '',
      lastError: null,
      isDone: false,
    };

    setState({
      progress: {
        ...base,
        total: event.total,
        processed: event.processed,
        succeeded: base.succeeded + (event.ok ? 1 : 0),
        failed: base.failed + (event.ok ? 0 : 1),
        lastSubject: event.subject,
        lastError: event.ok ? null : (event.error ?? 'Draft generation failed'),
        isDone: event.processed >= event.total,
      },
    });
    return;
  }

  setState({
    progress: {
      total: event.total,
      processed: event.processed,
      succeeded: event.succeeded,
      failed: event.failed,
      lastSubject: state.progress?.lastSubject ?? '',
      lastError: state.progress?.lastError ?? null,
      isDone: true,
    },
  });
}

async function start() {
  if (state.isRunning) {
    return;
  }

  abortController = new AbortController();
  setState({ isRunning: true, message: null });

  try {
    await api.generateOpenDraftsStream(applyEvent, abortController.signal);
    setState({ message: 'Draft generation finished.' });
  } catch {
    const wasAborted = abortController?.signal.aborted ?? false;
    setState({
      message: wasAborted
        ? 'Draft generation stopped.'
        : 'Failed to generate drafts for open emails.',
    });
  } finally {
    abortController = null;
    setState({ isRunning: false });
  }
}

function stop() {
  abortController?.abort();
}

function resetMessage() {
  setState({ message: null });
}

function getState() {
  return state;
}

function getReviewForEmail(emailId: number): GenerateDraftResponse | null {
  return reviewByEmailId.get(emailId) ?? null;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

function subscribeEvents(listener: EventListener) {
  eventListeners.add(listener);
  return () => {
    eventListeners.delete(listener);
  };
}

export const openDraftGenerationManager = {
  getState,
  getReviewForEmail,
  resetMessage,
  start,
  stop,
  subscribe,
  subscribeEvents,
};
