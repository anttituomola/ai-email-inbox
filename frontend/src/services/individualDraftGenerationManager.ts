import { api } from '../api';
import type { GenerateDraftResponse } from '../types';

export interface IndividualDraftGenerationState {
  isRunning: boolean;
  emailId: number | null;
  startedAt: number | null;
  error: string | null;
}

export type IndividualDraftGenerationEvent =
  | { type: 'completed'; emailId: number; response: GenerateDraftResponse }
  | { type: 'failed'; emailId: number; error: string }
  | { type: 'cancelled'; emailId: number };

type Listener = (state: IndividualDraftGenerationState) => void;
type EventListener = (event: IndividualDraftGenerationEvent) => void;

let state: IndividualDraftGenerationState = {
  isRunning: false,
  emailId: null,
  startedAt: null,
  error: null,
};

let abortController: AbortController | null = null;
const listeners = new Set<Listener>();
const eventListeners = new Set<EventListener>();
const responseByEmailId = new Map<number, GenerateDraftResponse>();

function emit() {
  for (const listener of listeners) {
    listener(state);
  }
}

function emitEvent(event: IndividualDraftGenerationEvent) {
  for (const listener of eventListeners) {
    listener(event);
  }
}

function setState(patch: Partial<IndividualDraftGenerationState>) {
  state = { ...state, ...patch };
  emit();
}

function getState() {
  return state;
}

function getResponseForEmail(emailId: number): GenerateDraftResponse | null {
  return responseByEmailId.get(emailId) ?? null;
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

function cancel() {
  const runningEmailId = state.emailId;
  abortController?.abort();
  abortController = null;

  if (runningEmailId !== null) {
    emitEvent({ type: 'cancelled', emailId: runningEmailId });
  }

  setState({
    isRunning: false,
    emailId: null,
    startedAt: null,
  });
}

function start(emailId: number, model: string): boolean {
  if (state.isRunning) {
    return false;
  }

  abortController = new AbortController();
  setState({
    isRunning: true,
    emailId,
    startedAt: performance.now(),
    error: null,
  });

  void (async () => {
    try {
      const response = await api.generateDraft(emailId, model, abortController?.signal);
      responseByEmailId.set(emailId, response);
      emitEvent({ type: 'completed', emailId, response });
      setState({ error: null });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      const message = 'Failed to generate draft. Please try again.';
      emitEvent({ type: 'failed', emailId, error: message });
      setState({ error: message });
    } finally {
      abortController = null;
      setState({
        isRunning: false,
        emailId: null,
        startedAt: null,
      });
    }
  })();

  return true;
}

export const individualDraftGenerationManager = {
  cancel,
  getResponseForEmail,
  getState,
  start,
  subscribe,
  subscribeEvents,
};
