import os

from openai import AsyncOpenAI

from constants.ai_models import DEFAULT_OPENAI_MODEL


openai_client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", DEFAULT_OPENAI_MODEL)
