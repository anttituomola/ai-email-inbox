from datetime import datetime, timedelta
import statistics
from typing import Callable

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from constants.ai_models import (
    EMAIL_STATUS_NEEDS_REVIEW,
    EMAIL_STATUS_OPEN,
    EMAIL_STATUS_RESOLVED,
)
from models import Email, GuestProfile
from schemas import EmailDetail, EmailListItem, EmailStats, NextEmailResponse


def build_email_preview(body: str, length: int = 100) -> str:
    if len(body) <= length:
        return body.replace("\n", " ")
    return body[:length].replace("\n", " ") + "..."


def serialize_email_detail(email: Email, guest: GuestProfile) -> EmailDetail:
    return EmailDetail(
        id=email.id,
        subject=email.subject,
        body=email.body,
        received_at=email.received_at,
        sent_at=email.sent_at,
        status=email.status,
        draft_text=email.draft_text or "",
        sent_reply=email.sent_reply or "",
        guest=guest,
    )


async def get_email_with_guest(db: AsyncSession, email_id: int) -> tuple[Email, GuestProfile]:
    result = await db.execute(
        select(Email, GuestProfile)
        .join(GuestProfile)
        .where(Email.id == email_id)
    )
    row = result.first()

    if row is None:
        raise HTTPException(status_code=404, detail="Email not found")

    return row


async def _mutate_and_serialize(
    db: AsyncSession,
    email_id: int,
    mutate_fn: Callable[[Email], None],
) -> EmailDetail:
    """Apply mutation function to email and return serialized result."""
    email, guest = await get_email_with_guest(db, email_id)
    mutate_fn(email)
    return serialize_email_detail(email, guest)


async def list_email_items(db: AsyncSession, status: str | None = None) -> list[EmailListItem]:
    query = select(Email, GuestProfile).join(GuestProfile)

    if status and status != "all":
        query = query.where(Email.status == status)

    result = await db.execute(query.order_by(Email.received_at.desc()))
    rows = result.all()

    return [
        EmailListItem(
            id=email.id,
            subject=email.subject,
            preview=build_email_preview(email.body),
            sender_name=guest.name,
            status=email.status,
            received_at=email.received_at,
            has_draft=bool((email.draft_text or "").strip()),
        )
        for email, guest in rows
    ]


async def get_email_detail(db: AsyncSession, email_id: int) -> EmailDetail:
    email, guest = await get_email_with_guest(db, email_id)
    return serialize_email_detail(email, guest)


async def update_email_status(db: AsyncSession, email_id: int, status: str) -> EmailDetail:
    return await _mutate_and_serialize(
        db, email_id, lambda email: setattr(email, 'status', status)
    )


async def save_email_draft(db: AsyncSession, email_id: int, draft_text: str) -> EmailDetail:
    return await _mutate_and_serialize(
        db, email_id, lambda email: setattr(email, 'draft_text', draft_text)
    )


async def send_email_reply(db: AsyncSession, email_id: int, reply_text: str) -> EmailDetail:
    def _mutate(email: Email) -> None:
        email.sent_reply = reply_text
        email.sent_at = datetime.utcnow()
        email.status = EMAIL_STATUS_RESOLVED

    return await _mutate_and_serialize(db, email_id, _mutate)


async def undo_send_email_reply(
    db: AsyncSession,
    email_id: int,
    previous_status: str,
) -> EmailDetail:
    def _mutate(email: Email) -> None:
        email.sent_reply = ""
        email.sent_at = None
        email.status = previous_status

    return await _mutate_and_serialize(db, email_id, _mutate)


async def get_next_unresolved_email(
    db: AsyncSession,
    current_email_id: int,
) -> EmailDetail | None:
    result = await db.execute(
        select(Email, GuestProfile)
        .join(GuestProfile)
        .where(Email.id != current_email_id)
        .where(Email.status == EMAIL_STATUS_OPEN)
        .order_by(Email.received_at.asc())
    )
    row = result.first()

    if row is None:
        return None

    email, guest = row
    return serialize_email_detail(email, guest)


async def build_send_and_next_response(
    db: AsyncSession,
    email_id: int,
    reply_text: str,
) -> NextEmailResponse:
    await send_email_reply(db, email_id, reply_text)
    next_email = await get_next_unresolved_email(db, email_id)

    if next_email is None:
        return NextEmailResponse(has_next=False)

    return NextEmailResponse(has_next=True, email=next_email)


async def calculate_email_stats(db: AsyncSession) -> EmailStats:
    result = await db.execute(select(Email))
    emails = result.scalars().all()

    now = datetime.utcnow()
    twelve_hours_ago = now - timedelta(hours=12)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())

    unresolved_count = 0
    old_unresolved_count = 0
    needs_review_count = 0
    resolved_today_count = 0
    handling_times_today: list[float] = []
    handling_times_week: list[float] = []

    for email in emails:
        if email.status != EMAIL_STATUS_RESOLVED:
            unresolved_count += 1
            if email.received_at < twelve_hours_ago:
                old_unresolved_count += 1
            if email.status == EMAIL_STATUS_NEEDS_REVIEW:
                needs_review_count += 1
            continue

        if email.sent_at and email.sent_at >= today_start:
            resolved_today_count += 1

        if email.sent_at and email.received_at:
            handling_time_minutes = (email.sent_at - email.received_at).total_seconds() / 60

            if email.sent_at >= today_start:
                handling_times_today.append(handling_time_minutes)
            if email.sent_at >= week_start:
                handling_times_week.append(handling_time_minutes)

    median_today = statistics.median(handling_times_today) if handling_times_today else None
    median_week = statistics.median(handling_times_week) if handling_times_week else None

    return EmailStats(
        unresolved_count=unresolved_count,
        old_unresolved_count=old_unresolved_count,
        median_handling_time_today_minutes=median_today,
        median_handling_time_week_minutes=median_week,
        needs_review_count=needs_review_count,
        resolved_today_count=resolved_today_count,
    )
