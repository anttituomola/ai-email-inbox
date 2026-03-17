import os
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from pydantic import BaseModel


# In-memory session store (sufficient for a single demo password)
# Structure: {session_id: timestamp}
active_sessions: set[str] = set()


DEMO_PASSWORD = os.getenv("DEMO_PASSWORD", "demo123")  # Default for dev only
COOKIE_NAME = "demo_session"
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "none" if COOKIE_SECURE else "lax")


class LoginRequest(BaseModel):
    password: str


class LoginResponse(BaseModel):
    success: bool
    message: str


class SessionResponse(BaseModel):
    authenticated: bool


router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(request: Request, response: Response, data: LoginRequest):
    if data.password != DEMO_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid password")

    # Generate simple session ID (good enough for demo)
    import uuid
    session_id = str(uuid.uuid4())
    active_sessions.add(session_id)

    # Set secure HTTP-only cookie
    response.set_cookie(
        key=COOKIE_NAME,
        value=session_id,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=86400,  # 24 hours
    )

    return LoginResponse(success=True, message="Logged in successfully")


@router.post("/logout")
async def logout(request: Request, response: Response):
    session_id = request.cookies.get(COOKIE_NAME)
    if session_id and session_id in active_sessions:
        active_sessions.discard(session_id)
    response.delete_cookie(
        COOKIE_NAME,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
    )
    return {"message": "Logged out successfully"}


@router.get("/session", response_model=SessionResponse)
async def check_session(request: Request):
    session_id = request.cookies.get(COOKIE_NAME)
    is_authenticated = session_id is not None and session_id in active_sessions
    return SessionResponse(authenticated=is_authenticated)


# Dependency to verify session for protected routes
async def require_auth(request: Request):
    session_id = request.cookies.get(COOKIE_NAME)
    if not session_id or session_id not in active_sessions:
        raise HTTPException(status_code=401, detail="Authentication required")
    return session_id
