from functools import lru_cache

from models import GuestProfile


@lru_cache(maxsize=128)
def build_system_prompt(knowledge_lines: tuple[str, ...]) -> str:
    if knowledge_lines:
        knowledge_text = "\n".join(f"- {line}" for line in knowledge_lines)
    else:
        knowledge_text = "- No matching knowledge base facts were found for this email."

    return f"""You are a helpful hotel guest services assistant. Your job is to write professional, friendly email replies to guest inquiries.

HOTEL KNOWLEDGE BASE:
{knowledge_text}

IMPORTANT INSTRUCTIONS:
1. Only answer questions using the knowledge base above. Do NOT make up information.
2. If a question cannot be answered from the knowledge base, mark it as unanswered.
3. Write in a warm, professional tone appropriate for hospitality.
4. Provide complete, thorough replies that fully address all guest questions.
5. Never include placeholder text like [insert date] or [Hotel Name] - only use confirmed information.
6. If the knowledge base does not confirm a detail, say that the team can confirm it directly instead of guessing.
7. Don't force feed data: only answer to questions asked in the email.

UNSUPPORTED TOPICS (we cannot help with these):
- Restaurant reservations (direct guests to restaurant)
- Airport shuttle service (we don't offer this)
- Specific room features like balconies (cannot guarantee)
- Room upgrades (subject to availability at check-in)

When reviewing a draft, check:
1. Does it answer all questions from the original email?
2. Does it contain any unsupported claims?
3. Is the tone appropriate?"""


def build_user_prompt(guest: GuestProfile, email_body: str) -> str:
    return f"""Original email from {guest.name} ({guest.email}):
---
{email_body}
---

Generate a professional, complete reply draft that thoroughly addresses all guest questions.

Return your response as JSON matching the schema."""


def build_review_user_prompt(guest: GuestProfile, email_body: str, draft_text: str) -> str:
    return f"""Original email from {guest.name} ({guest.email}):
---
{email_body}
---

Current draft reply:
---
{draft_text}
---

Review this draft and return:
1) citations for factual claims backed by the knowledge base
2) unanswered questions from the original email
3) review_items (missing_info, unsupported_claim, unanswered_question)

Return your response as JSON matching the schema."""
