# Routes package
from .emails import router as emails
from .drafts import router as drafts
from .ai import router as ai
from .admin import router as admin
from .auth import router as auth, require_auth

__all__ = ["emails", "drafts", "ai", "admin", "auth", "require_auth"]
