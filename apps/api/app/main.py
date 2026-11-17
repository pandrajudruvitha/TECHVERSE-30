import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.assets import router as assets_router
from app.auth import router as auth_router
from app.schemas import HealthResponse

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
app.include_router(auth_router)
app.include_router(assets_router)


@app.get("/health", response_model=HealthResponse, tags=["platform"])
async def health_check() -> HealthResponse:
    return HealthResponse(service="techverse-api", status="ok", version=app.version)
