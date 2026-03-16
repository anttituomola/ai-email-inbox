from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas import DraftUpdate, SendReplyRequest, UndoSendRequest, NextEmailResponse, EmailDetail
from services.email_service import (
    build_send_and_next_response,
    save_email_draft,
    send_email_reply,
    undo_send_email_reply,
)

router = APIRouter()


@router.patch("/{email_id}", response_model=EmailDetail)
async def save_draft(
    email_id: int,
    update: DraftUpdate,
    db: AsyncSession = Depends(get_db)
):
    return await save_email_draft(db, email_id, update.draft_text)


@router.post("/{email_id}/send", response_model=EmailDetail)
async def send_reply(
    email_id: int,
    request: SendReplyRequest,
    db: AsyncSession = Depends(get_db)
):
    return await send_email_reply(db, email_id, request.reply_text)


@router.post("/{email_id}/undo-send", response_model=EmailDetail)
async def undo_send(
    email_id: int,
    request: UndoSendRequest,
    db: AsyncSession = Depends(get_db)
):
    return await undo_send_email_reply(db, email_id, request.previous_status)


@router.post("/{email_id}/send-and-next", response_model=NextEmailResponse)
async def send_and_next(
    email_id: int,
    request: SendReplyRequest,
    db: AsyncSession = Depends(get_db)
):
    return await build_send_and_next_response(db, email_id, request.reply_text)
