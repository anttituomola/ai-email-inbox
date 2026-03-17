from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from constants.ai_models import (
    OPENAI_MODEL_OPTIONS,
    DEFAULT_OPENAI_MODEL,
)
from models import KnowledgeEntry
from schemas import GenerateDraftResponse, ReviewDraftResponse
from services.ai_client import OPENAI_MODEL, openai_client
from services.ai_prompt_service import (
    build_review_user_prompt,
    build_system_prompt,
    build_user_prompt,
)
from services.ai_response_service import (
    DRAFT_RESPONSE_SCHEMA,
    REVIEW_RESPONSE_SCHEMA,
    build_review_draft_response,
    build_generate_draft_response,
    parse_ai_output,
)
from services.email_service import get_email_with_guest


def get_openai_model_config() -> tuple[tuple[str, ...], str]:
    model_from_env = OPENAI_MODEL
    if model_from_env in OPENAI_MODEL_OPTIONS:
        return OPENAI_MODEL_OPTIONS, model_from_env
    return OPENAI_MODEL_OPTIONS, DEFAULT_OPENAI_MODEL


def _normalize_knowledge_key(value: str) -> str:
    return value.strip().lower().replace(" ", "_")


def _resolve_citation_source_facts(ai_output: dict, knowledge_entries: list[KnowledgeEntry]) -> None:
    knowledge_by_topic = {
        _normalize_knowledge_key(entry.topic): entry.content
        for entry in knowledge_entries
    }

    for citation in ai_output.get("citations", []):
        source_fact = citation.get("source_fact", "")
        if not isinstance(source_fact, str):
            continue

        resolved_source_fact = knowledge_by_topic.get(_normalize_knowledge_key(source_fact))
        if resolved_source_fact:
            citation["source_fact"] = resolved_source_fact

async def generate_draft_for_email(
    db: AsyncSession, email_id: int, model: str | None = None
) -> GenerateDraftResponse:
    email, guest = await get_email_with_guest(db, email_id)
    _, configured_default_model = get_openai_model_config()
    model_to_use = model or configured_default_model

    if model is not None and model not in OPENAI_MODEL_OPTIONS:
        raise HTTPException(status_code=400, detail="Unsupported model")

    result = await db.execute(select(KnowledgeEntry).order_by(KnowledgeEntry.topic))
    knowledge_entries = result.scalars().all()
    system_prompt = build_system_prompt(
        tuple(f"{entry.topic}: {entry.content}" for entry in knowledge_entries)
    )
    user_prompt = build_user_prompt(guest, email.body)

    try:
        response = await openai_client.responses.create(
            model=model_to_use,
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "draft_response",
                    "schema": DRAFT_RESPONSE_SCHEMA,
                    "strict": True
                }
            }
        )

        ai_output = parse_ai_output(response)
        _resolve_citation_source_facts(ai_output, knowledge_entries)
        email.draft_text = ai_output["draft_text"]
        return build_generate_draft_response(ai_output)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(exc)}")


async def review_existing_draft(
    db: AsyncSession, email_id: int, draft_text: str, model: str | None = None
) -> ReviewDraftResponse:
    email, guest = await get_email_with_guest(db, email_id)
    _, configured_default_model = get_openai_model_config()
    model_to_use = model or configured_default_model

    if model is not None and model not in OPENAI_MODEL_OPTIONS:
        raise HTTPException(status_code=400, detail="Unsupported model")

    result = await db.execute(select(KnowledgeEntry).order_by(KnowledgeEntry.topic))
    knowledge_entries = result.scalars().all()
    system_prompt = build_system_prompt(
        tuple(f"{entry.topic}: {entry.content}" for entry in knowledge_entries)
    )
    user_prompt = build_review_user_prompt(guest, email.body, draft_text)

    try:
        response = await openai_client.responses.create(
            model=model_to_use,
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "review_response",
                    "schema": REVIEW_RESPONSE_SCHEMA,
                    "strict": True
                }
            }
        )

        ai_output = parse_ai_output(response)
        _resolve_citation_source_facts(ai_output, knowledge_entries)
        return build_review_draft_response(ai_output)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI review failed: {str(exc)}")
