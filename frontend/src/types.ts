export type EmailStatus = 'open' | 'needs_review' | 'resolved';

export type EmailFilter = 'all' | 'unresolved' | EmailStatus;

export type SortOrder = 'desc' | 'asc';

export type AppView = 'dashboard' | 'email';

export interface GuestProfile {
  id: number;
  name: string;
  email: string;
}

export interface EmailListItem {
  id: number;
  subject: string;
  preview: string;
  sender_name: string;
  status: EmailStatus;
  received_at: string;
  has_draft: boolean;
}

export interface EmailDetail {
  id: number;
  subject: string;
  body: string;
  received_at: string;
  sent_at: string | null;
  status: EmailStatus;
  draft_text: string;
  sent_reply: string;
  guest: GuestProfile;
}

export interface ReviewItem {
  id: string;  // Stable identifier based on type + normalized description
  type: 'missing_info' | 'unsupported_claim' | 'unanswered_question';
  description: string;
  severity: 'warning' | 'critical';
}

export interface Citation {
  exact_quote: string;
  source_fact: string;
}

export interface GenerateDraftResponse {
  draft_text: string;
  citations: Citation[];
  unanswered_questions: string[];
  review_items: ReviewItem[];
}

export interface AIModelsResponse {
  models: string[];
  default_model: string;
}

export interface ReviewDraftResponse {
  citations: Citation[];
  unanswered_questions: string[];
  review_items: ReviewItem[];
}

export interface EmailStats {
  unresolved_count: number;
  old_unresolved_count: number;
  median_handling_time_today_minutes: number | null;
  median_handling_time_week_minutes: number | null;
  needs_review_count: number;
  resolved_today_count: number;
}

export interface NextEmailResponse {
  has_next: boolean;
  email?: EmailDetail;
}

export interface DemoResetResponse {
  reset_email_count: number;
  message: string;
}

export type OpenDraftGenerationEvent =
  | {
      type: 'start';
      total: number;
    }
  | {
      type: 'progress';
      processed: number;
      total: number;
      email_id: number;
      subject: string;
      ok: boolean;
      error?: string;
      review?: {
        citations: Citation[];
        unanswered_questions: string[];
        review_items: ReviewItem[];
      };
    }
  | {
      type: 'complete';
      processed: number;
      total: number;
      succeeded: number;
      failed: number;
    };
