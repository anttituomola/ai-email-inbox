from pydantic import BaseModel
from typing import List, Literal, Optional
from datetime import datetime

from constants.ai_models import (
    OPENAI_MODEL_OPTIONS,
    REVIEW_ITEM_TYPES,
    REVIEW_SEVERITY_LEVELS,
)


class GuestProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    
    class Config:
        from_attributes = True


class EmailListItem(BaseModel):
    id: int
    subject: str
    preview: str
    sender_name: str
    status: str
    received_at: datetime
    has_draft: bool
    
    class Config:
        from_attributes = True


class EmailDetail(BaseModel):
    id: int
    subject: str
    body: str
    received_at: datetime
    sent_at: Optional[datetime] = None
    status: str
    draft_text: str
    sent_reply: str
    guest: GuestProfileResponse
    
    class Config:
        from_attributes = True


class StatusUpdate(BaseModel):
    status: str


class DraftUpdate(BaseModel):
    draft_text: str


class SendReplyRequest(BaseModel):
    reply_text: str


class UndoSendRequest(BaseModel):
    previous_status: str


class KnowledgeEntryResponse(BaseModel):
    topic: str
    content: str


class AIDraftRequest(BaseModel):
    email_id: int
    model: Optional[Literal[OPENAI_MODEL_OPTIONS]] = None  # type: ignore


class GenerateOpenDraftsRequest(BaseModel):
    model: Optional[Literal[OPENAI_MODEL_OPTIONS]] = None  # type: ignore


class AIModelsResponse(BaseModel):
    models: List[Literal[OPENAI_MODEL_OPTIONS]]  # type: ignore
    default_model: Literal[OPENAI_MODEL_OPTIONS]  # type: ignore


class ReviewItem(BaseModel):
    id: str  # Stable identifier based on type + normalized description
    type: Literal[REVIEW_ITEM_TYPES]  # type: ignore
    description: str
    severity: Literal[REVIEW_SEVERITY_LEVELS]  # type: ignore


class Citation(BaseModel):
    exact_quote: str
    source_fact: str


class ReviewDraftRequest(BaseModel):
    email_id: int
    draft_text: str


class ReviewDraftResponse(BaseModel):
    citations: List[Citation]
    unanswered_questions: List[str]
    review_items: List[ReviewItem]


class GenerateDraftResponse(BaseModel):
    draft_text: str
    citations: List[Citation]
    unanswered_questions: List[str]
    review_items: List[ReviewItem]


class EmailStats(BaseModel):
    unresolved_count: int
    old_unresolved_count: int
    median_handling_time_today_minutes: Optional[float]
    median_handling_time_week_minutes: Optional[float]
    needs_review_count: int
    resolved_today_count: int

class NextEmailResponse(BaseModel):
    has_next: bool
    email: Optional[EmailDetail] = None


class DemoResetResponse(BaseModel):
    reset_email_count: int
    message: str
