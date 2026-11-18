from datetime import datetime

from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class HealthResponse(BaseModel):
    service: str
    status: str
    version: str


class AIChatRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    message: str = Field(min_length=1, max_length=8000)
    system_prompt: str = Field(
        default="You are a concise, accurate technology assistant.",
        max_length=2000,
    )


class AIChatResponse(BaseModel):
    message: str
    model: str
    provider: str


class AIStatusResponse(BaseModel):
    configured: bool
    model: str


class IntegrationStatusResponse(BaseModel):
    api: str
    ai_configured: bool
    ai_model: str
    assets: str
    module_workbenches: str


class RegisterRequest(BaseModel):
    email: EmailStr = Field(max_length=320)
    password: str = Field(min_length=12, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr = Field(max_length=320)
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


AssetStatus = Literal["active", "maintenance", "retired"]


class AssetCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=160)
    asset_tag: str = Field(min_length=1, max_length=64)
    category: str = Field(default="Other", min_length=1, max_length=80)
    assigned_to: str | None = Field(default=None, max_length=160)
    location: str | None = Field(default=None, max_length=160)
    status: AssetStatus = "active"
    notes: str | None = Field(default=None, max_length=2000)


class AssetUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = Field(default=None, min_length=1, max_length=160)
    asset_tag: str | None = Field(default=None, min_length=1, max_length=64)
    category: str | None = Field(default=None, min_length=1, max_length=80)
    assigned_to: str | None = Field(default=None, max_length=160)
    location: str | None = Field(default=None, max_length=160)
    status: AssetStatus | None = None
    notes: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def validate_changes(self) -> "AssetUpdate":
        if not self.model_fields_set:
            raise ValueError("At least one asset field must be provided.")
        for field in ("name", "asset_tag", "category", "status"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null.")
        return self


class AssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    asset_tag: str
    category: str
    assigned_to: str | None
    location: str | None
    status: AssetStatus
    notes: str | None
    created_at: datetime
    updated_at: datetime
