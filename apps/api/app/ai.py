import os

import httpx
from fastapi import APIRouter, HTTPException

from app.platform_security import validate_provider_base_url
from app.schemas import AIChatRequest, AIChatResponse, AIStatusResponse

router = APIRouter(prefix="/ai", tags=["central-ai"])


def ai_configuration() -> tuple[str, str, str]:
    api_key = os.getenv("LLM_API_KEY", "").strip()
    base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").strip().rstrip("/")
    model = os.getenv("LLM_MODEL", "gpt-4o-mini").strip()
    return api_key, base_url, model or "gpt-4o-mini"


@router.get("/status", response_model=AIStatusResponse)
def ai_status() -> AIStatusResponse:
    api_key, _, model = ai_configuration()
    return AIStatusResponse(configured=bool(api_key), model=model)


@router.post("/chat", response_model=AIChatResponse)
async def ai_chat(payload: AIChatRequest) -> AIChatResponse:
    api_key, base_url, model = ai_configuration()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Central AI is not configured. Set LLM_API_KEY and restart the API.",
        )

    try:
        base_url = validate_provider_base_url(base_url)
    except ValueError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": payload.system_prompt},
                        {"role": "user", "content": payload.message},
                    ],
                    "temperature": 0.3,
                },
            )
    except httpx.RequestError as error:
        raise HTTPException(status_code=502, detail="The AI provider could not be reached.") from error

    if response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"The AI provider returned HTTP {response.status_code}.",
        )

    try:
        result = response.json()
        message = result["choices"][0]["message"]["content"].strip()
    except (ValueError, KeyError, IndexError, AttributeError, TypeError) as error:
        raise HTTPException(status_code=502, detail="The AI provider returned an invalid response.") from error

    if not message:
        raise HTTPException(status_code=502, detail="The AI provider returned an empty response.")

    provider = os.getenv("LLM_PROVIDER", "OpenAI-compatible").strip() or "OpenAI-compatible"
    return AIChatResponse(message=message, model=model, provider=provider)
