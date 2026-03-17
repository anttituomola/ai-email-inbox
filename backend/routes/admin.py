from fastapi import APIRouter

from clear_responses import clear_responses_and_statuses
from schemas import DemoResetResponse

router = APIRouter()


@router.post("/reset-demo", response_model=DemoResetResponse)
async def reset_demo_state():
    reset_email_count = await clear_responses_and_statuses()
    return DemoResetResponse(
        reset_email_count=reset_email_count,
        message="Demo data reset successfully.",
    )
