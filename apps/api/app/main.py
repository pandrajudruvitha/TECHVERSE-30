import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.ai import router as ai_router
from app.assets import router as assets_router
from app.auth import router as auth_router
from app.integrations import router as integrations_router
from app.platform_security import PlatformSecurityMiddleware
from app.schemas import HealthResponse, SecurityStatusResponse

frontend_origin = os.getenv("FRONTEND_ORIGIN")
default_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
allowed_origins = [
    origin.strip()
    for origin in (frontend_origin.split(",") if frontend_origin else default_origins)
    if origin.strip()
]

app = FastAPI(
    title="TECHVERSE 30 API",
    description="Backend foundation for the TECHVERSE 30 platform.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
)
app.add_middleware(PlatformSecurityMiddleware)
app.include_router(auth_router)
app.include_router(assets_router)
app.include_router(ai_router)
app.include_router(integrations_router)


@app.get("/health", response_model=HealthResponse, tags=["platform"])
async def health_check() -> HealthResponse:
    return HealthResponse(service="techverse-api", status="ok", version=app.version)


@app.get("/security/status", response_model=SecurityStatusResponse, tags=["platform"])
async def security_status() -> SecurityStatusResponse:
    return SecurityStatusResponse(
        security_headers=True,
        bearer_auth=True,
        cors_allowlist=bool(allowed_origins),
        request_limits=True,
        no_store_sensitive_routes=True,
    )
