import { api } from '../api';
import type { ReviewDraftResponse } from '../types';

interface DraftReviewCompletedEvent {
  type: 'completed';
  emailId: number;
  draftText: string;
  response: ReviewDraftResponse;
}

interface DraftReviewFailedEvent {
  type: 'failed';
  emailId: number;
  draftText: string;
  error: string;
}

export type DraftReviewEvent = DraftReviewCompletedEvent | DraftReviewFailedEvent;

type EventListener = (event: DraftReviewEvent) => void;

function getReviewKey(emailId: number, draftText: string) {
  return `${emailId}:${draftText}`;
}

const cachedReviews = new Map<string, ReviewDraftResponse>();
const inFlightReviews = new Map<string, Promise<ReviewDraftResponse>>();
const eventListeners = new Set<EventListener>();

function emitEvent(event: DraftReviewEvent) {
  for (const listener of eventListeners) {
    listener(event);
  }
}

function getCachedReview(emailId: number, draftText: string): ReviewDraftResponse | null {
  return cachedReviews.get(getReviewKey(emailId, draftText)) ?? null;
}

function subscribeEvents(listener: EventListener) {
  eventListeners.add(listener);
  return () => {
    eventListeners.delete(listener);
  };
}

function start(emailId: number, draftText: string): Promise<ReviewDraftResponse> {
  const reviewKey = getReviewKey(emailId, draftText);
  const cachedReview = cachedReviews.get(reviewKey);
  if (cachedReview) {
    return Promise.resolve(cachedReview);
  }

  const existingRequest = inFlightReviews.get(reviewKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = api
    .reviewDraft(emailId, draftText)
    .then((response) => {
      cachedReviews.set(reviewKey, response);
      emitEvent({ type: 'completed', emailId, draftText, response });
      return response;
    })
    .catch(() => {
      const error = 'Failed to review draft. Please try again.';
      emitEvent({ type: 'failed', emailId, draftText, error });
      throw new Error(error);
    })
    .finally(() => {
      inFlightReviews.delete(reviewKey);
    });

  inFlightReviews.set(reviewKey, request);
  return request;
}

export const draftReviewManager = {
  getCachedReview,
  start,
  subscribeEvents,
};
