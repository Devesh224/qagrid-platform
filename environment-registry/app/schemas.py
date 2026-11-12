import uuid
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

class EnvironmentType(str, Enum):
    BROWSER = "BROWSER"
    MOBILE = "MOBILE"
    API = "API"

class EnvironmentStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    UNDER_MAINTENANCE = "UNDER_MAINTENANCE"

class HealthStatus(str, Enum):
    HEALTHY = "HEALTHY"
    UNHEALTHY = "UNHEALTHY"
    UNKNOWN = "UNKNOWN"

class EnvironmentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    environment_type: EnvironmentType
    platform: str | None = Field(default=None, max_length=100)
    operating_system: str | None = Field(default=None, max_length=100)
    browser: str | None = Field(default=None, max_length=100)
    browser_version: str | None = Field(default=None, max_length=50)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("name cannot be blank")
        return value

class EnvironmentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    environment_type: EnvironmentType | None = None
    platform: str | None = Field(default=None, max_length=100)
    operating_system: str | None = Field(default=None, max_length=100)
    browser: str | None = Field(default=None, max_length=100)
    browser_version: str | None = Field(default=None, max_length=50)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("name cannot be blank")
        return value

class StatusChange(BaseModel):
    status: EnvironmentStatus
    maintenance_reason: str | None = Field(default=None, max_length=1000)
    maintenance_ends_at: datetime | None = None

    @model_validator(mode="after")
    def check_maintenance(self):
        if self.status == EnvironmentStatus.UNDER_MAINTENANCE:
            if not self.maintenance_reason or not self.maintenance_reason.strip():
                raise ValueError("maintenance_reason is required")
        if self.maintenance_ends_at and self.maintenance_ends_at.tzinfo is None:
            raise ValueError("maintenance_ends_at needs a timezone")
        return self

class HealthChange(BaseModel):
    health_status: HealthStatus

class EnvironmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    environment_id: uuid.UUID
    name: str
    environment_type: EnvironmentType
    platform: str | None
    operating_system: str | None
    browser: str | None
    browser_version: str | None
    status: EnvironmentStatus
    health_status: HealthStatus
    maintenance_reason: str | None
    maintenance_started_at: datetime | None
    maintenance_ends_at: datetime | None
    created_at: datetime
    updated_at: datetime

class EnvironmentList(BaseModel):
    items: list[EnvironmentRead]
    total: int
    limit: int
    offset: int
