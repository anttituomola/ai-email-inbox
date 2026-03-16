import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from constants.ai_models import EMAIL_STATUS_OPEN
from database import get_db
from models import Email
from schemas import (
    AIDraftRequest,
    AIModelsResponse,
    GenerateDraftResponse,
    GenerateOpenDraftsRequest,
    ReviewDraftRequest,
    ReviewDraftResponse,
)
from services.ai_draft_service import (
    generate_draft_for_email,
    get_openai_model_config,
    review_existing_draft,
)

router = APIRouter()

@router.get("/models", response_model=AIModelsResponse)
async def get_models():
    models, default_model = get_openai_model_config()
    return {"models": list(models), "default_model": default_model}


@router.post("/generate-draft", response_model=GenerateDraftResponse)
async def generate_draft(
    request: AIDraftRequest,
    db: AsyncSession = Depends(get_db)
):
    return await generate_draft_for_email(db, request.email_id, request.model)


@router.post("/review-draft", response_model=ReviewDraftResponse)
async def review_draft(
    request: ReviewDraftRequest,
    db: AsyncSession = Depends(get_db)
):
    return await review_existing_draft(db, request.email_id, request.draft_text)


@router.post("/generate-open-drafts/stream")
async def generate_open_drafts_stream(
    request: GenerateOpenDraftsRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Email.id, Email.subject)
        .where(Email.status == EMAIL_STATUS_OPEN)
        .where(or_(Email.draft_text.is_(None), func.trim(Email.draft_text) == ""))
        .order_by(Email.received_at.asc())
    )
    open_emails = result.all()
    total = len(open_emails)

    def _build_progress_payload(
        index: int,
        email_id: int,
        subject: str,
        ok: bool,
        error: str | None = None,
        review: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Build a standardized progress payload for stream events."""
        payload: dict[str, Any] = {
            "type": "progress",
            "processed": index,
            "total": total,
            "email_id": email_id,
            "subject": subject,
            "ok": ok,
        }
        if error is not None:
            payload["error"] = error
        if review is not None:
            payload["review"] = review
        return payload

    def _extract_error_message(exc: Exception) -> str:
        """Extract error message from exception."""
        if isinstance(exc, HTTPException):
            return str(exc.detail)
        return str(exc)

    async def stream_events():
        yield json.dumps({"type": "start", "total": total}) + "\n"
        succeeded = 0
        failed = 0

        for index, row in enumerate(open_emails, start=1):
            email_id, subject = row
            try:
                generated = await generate_draft_for_email(db, email_id, request.model)
                await db.commit()
                succeeded += 1
                review = {
                    "citations": [citation.model_dump() for citation in generated.citations],
                    "unanswered_questions": generated.unanswered_questions,
                    "review_items": [item.model_dump() for item in generated.review_items],
                }
                yield json.dumps(
                    _build_progress_payload(index, email_id, subject, ok=True, review=review)
                ) + "\n"
            except Exception as exc:
                await db.rollback()
                failed += 1
                error_message = _extract_error_message(exc)
                yield json.dumps(
                    _build_progress_payload(index, email_id, subject, ok=False, error=error_message)
                ) + "\n"

        yield json.dumps(
            {
                "type": "complete",
                "processed": total,
                "total": total,
                "succeeded": succeeded,
                "failed": failed,
            }
        ) + "\n"

    return StreamingResponse(stream_events(), media_type="application/x-ndjson")


