import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth import router as auth_router
from app.schemas import HealthResponse

app = FastAPI(
    title="TECHVERSE 30 API",
    description="Backend foundation for the TECHVERSE 30 platform.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
app.include_router(auth_router)


@app.get("/health", response_model=HealthResponse, tags=["platform"])
async def health_check() -> HealthResponse:
    return HealthResponse(service="techverse-api", status="ok", version=app.version)
