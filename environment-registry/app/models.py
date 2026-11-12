import uuid
from datetime import datetime
from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base

class Environment(Base):
    __tablename__ = "environments"
    environment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    environment_type: Mapped[str] = mapped_column(String(20), nullable=False)
    platform: Mapped[str | None] = mapped_column(String(100))
    operating_system: Mapped[str | None] = mapped_column(String(100))
    browser: Mapped[str | None] = mapped_column(String(100))
    browser_version: Mapped[str | None] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(25), nullable=False, default="ACTIVE")
    health_status: Mapped[str] = mapped_column(String(20), nullable=False, default="UNKNOWN")
    maintenance_reason: Mapped[str | None] = mapped_column(Text)
    maintenance_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    maintenance_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
