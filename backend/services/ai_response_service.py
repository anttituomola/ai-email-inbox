import json

from constants.ai_models import REVIEW_ITEM_TYPES, REVIEW_SEVERITY_LEVELS
from schemas import GenerateDraftResponse, ReviewDraftResponse, ReviewItem


DRAFT_RESPONSE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "draft_text": {
            "type": "string",
            "description": "The complete email reply draft to send to the guest"
        },
        "citations": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "exact_quote": {
                        "type": "string",
                        "description": "Exact text copied verbatim from the generated draft that makes a factual claim supported by the knowledge base"
                    },
                    "source_fact": {
                        "type": "string",
                        "description": "The exact supporting knowledge base fact that backs up the quoted claim"
                    }
                },
                "required": ["exact_quote", "source_fact"]
            },
            "description": "Knowledge-backed claims in the draft mapped to their supporting fact"
        },
        "unanswered_questions": {
            "type": "array",
            "items": {"type": "string"},
            "description": "List of questions from the email that could not be answered"
        },
        "review_items": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "id": {"type": "string"},
                    "type": {
                        "type": "string",
                        "enum": list(REVIEW_ITEM_TYPES)
                    },
                    "description": {"type": "string"},
                    "severity": {
                        "type": "string",
                        "enum": list(REVIEW_SEVERITY_LEVELS)
                    }
                },
                "required": ["id", "type", "description", "severity"]
            },
            "description": "List of review items for the staff to check"
        }
    },
    "required": ["draft_text", "citations", "unanswered_questions", "review_items"]
}

REVIEW_RESPONSE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "citations": DRAFT_RESPONSE_SCHEMA["properties"]["citations"],
        "unanswered_questions": DRAFT_RESPONSE_SCHEMA["properties"]["unanswered_questions"],
        "review_items": DRAFT_RESPONSE_SCHEMA["properties"]["review_items"],
    },
    "required": ["citations", "unanswered_questions", "review_items"],
}


def generate_review_item_id(item_type: str, description: str) -> str:
    normalized = description.lower().strip().replace(" ", "_")[:50]
    return f"{item_type}_{normalized}"


def extract_output_text(response) -> str:
    output_text = None

    for item in response.output:
        if hasattr(item, "content") and item.content:
            for content_item in item.content:
                if hasattr(content_item, "text"):
                    output_text = content_item.text
                    break
        if output_text:
            break

    if not output_text:
        raise ValueError("No text content found in response")

    return output_text


def parse_ai_output(response) -> dict:
    return json.loads(extract_output_text(response))


def build_generate_draft_response(ai_output: dict) -> GenerateDraftResponse:
    review_items = [
        ReviewItem(
            id=item.get("id", generate_review_item_id(item["type"], item["description"])),
            type=item["type"],
            description=item["description"],
            severity=item["severity"]
        )
        for item in ai_output["review_items"]
    ]

    return GenerateDraftResponse(
        draft_text=ai_output["draft_text"],
        citations=ai_output["citations"],
        unanswered_questions=ai_output["unanswered_questions"],
        review_items=review_items,
    )


def build_review_draft_response(ai_output: dict) -> ReviewDraftResponse:
    review_items = [
        ReviewItem(
            id=item.get("id", generate_review_item_id(item["type"], item["description"])),
            type=item["type"],
            description=item["description"],
            severity=item["severity"]
        )
        for item in ai_output["review_items"]
    ]

    return ReviewDraftResponse(
        citations=ai_output["citations"],
        unanswered_questions=ai_output["unanswered_questions"],
        review_items=review_items,
    )
