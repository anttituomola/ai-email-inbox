"""Central constants for AI model configuration."""

# Model options for OpenAI
OPENAI_MODEL_OPTIONS = ("gpt-5", "gpt-5-mini", "gpt-5-nano")
DEFAULT_OPENAI_MODEL = "gpt-5-nano"

# Response item types
REVIEW_ITEM_TYPES = ("missing_info", "unsupported_claim", "unanswered_question")
REVIEW_SEVERITY_LEVELS = ("warning", "critical")

# Email status constants
EMAIL_STATUS_OPEN = "open"
EMAIL_STATUS_RESOLVED = "resolved"
EMAIL_STATUS_NEEDS_REVIEW = "needs_review"
EMAIL_STATUS_ALL = "all"
EMAIL_STATUS_UNRESOLVED = "unresolved"

ALL_EMAIL_STATUSES = (
    EMAIL_STATUS_OPEN,
    EMAIL_STATUS_RESOLVED,
    EMAIL_STATUS_NEEDS_REVIEW,
)
