from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database import get_db
from schemas import EmailListItem, EmailDetail, StatusUpdate, EmailStats
from services.email_service import (
    calculate_email_stats,
    get_email_detail,
    list_email_items,
    update_email_status,
)

router = APIRouter()


@router.get("", response_model=List[EmailListItem])
async def list_emails(
    status: str = None,
    db: AsyncSession = Depends(get_db)
):
    return await list_email_items(db, status)


@router.get("/stats", response_model=EmailStats)
async def get_email_stats(db: AsyncSession = Depends(get_db)):
    return await calculate_email_stats(db)


@router.get("/{email_id}", response_model=EmailDetail)
async def get_email(email_id: int, db: AsyncSession = Depends(get_db)):
    return await get_email_detail(db, email_id)


@router.patch("/{email_id}/status", response_model=EmailDetail)
async def update_status(
    email_id: int,
    update: StatusUpdate,
    db: AsyncSession = Depends(get_db)
):
    return await update_email_status(db, email_id, update.status)
