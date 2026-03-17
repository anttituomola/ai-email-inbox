"""Script to clear all draft responses and reset email statuses to 'open'."""

import asyncio
from sqlalchemy import update
from database import async_session, engine
from models import Email


async def clear_responses_and_statuses():
    """Reset all emails: clear drafts/sent replies and set status back to 'open'."""
    async with async_session() as session:
        async with session.begin():
            stmt = (
                update(Email)
                .values(
                    status="open",
                    draft_text="",
                    sent_reply="",
                    sent_at=None
                )
            )
            result = await session.execute(stmt)
            rowcount = result.rowcount or 0
        await session.commit()
        return rowcount


if __name__ == "__main__":
    cleared_count = asyncio.run(clear_responses_and_statuses())
    print(f"Cleared responses and reset status for {cleared_count} emails.")
