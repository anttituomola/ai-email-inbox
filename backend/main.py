from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

from database import init_db
from routes import emails, drafts, ai, admin
from routes.auth import router as auth_router, require_auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="AI Email Inbox API",
    description="Hotel email AI assistance with trust-first review workflow",
    version="1.0.0",
    lifespan=lifespan
)

# Parse CORS origins from environment variable, fallback to localhost for development
cors_origins_env = os.getenv("CORS_ORIGINS", "")
if cors_origins_env:
    allow_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
else:
    allow_origins = ["http://localhost:5173", "http://localhost:5174"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Public routes (no auth required)
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])

# Protected routes (require auth)
app.include_router(
    emails,
    prefix="/api/emails",
    tags=["emails"],
    dependencies=[Depends(require_auth)]
)
app.include_router(
    drafts,
    prefix="/api/drafts",
    tags=["drafts"],
    dependencies=[Depends(require_auth)]
)
app.include_router(
    ai,
    prefix="/api/ai",
    tags=["ai"],
    dependencies=[Depends(require_auth)]
)
app.include_router(
    admin,
    prefix="/api/admin",
    tags=["admin"],
    dependencies=[Depends(require_auth)]
)


@app.get("/health")
async def health_check():
    return {"status": "healthy"}