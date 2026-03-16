from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

from database import init_db
from routes import emails, drafts, ai


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(emails.router, prefix="/api/emails", tags=["emails"])
app.include_router(drafts.router, prefix="/api/drafts", tags=["drafts"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
