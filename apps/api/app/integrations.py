from fastapi import APIRouter

from app.ai import ai_configuration
from app.schemas import IntegrationStatusResponse

router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.get("/status", response_model=IntegrationStatusResponse)
def integration_status() -> IntegrationStatusResponse:
    api_key, _, model = ai_configuration()
    return IntegrationStatusResponse(
        api="connected",
        ai_configured=bool(api_key),
        ai_model=model,
        assets="authenticated",
        module_workbenches="browser-local",
    )
