import uuid
from datetime import datetime, timezone
from fastapi import Depends, FastAPI, HTTPException, Query, status
from sqlalchemy import func, select, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session
from .database import get_db
from .models import Environment
from .schemas import (EnvironmentCreate, EnvironmentList, EnvironmentRead,
    EnvironmentStatus, EnvironmentType, EnvironmentUpdate, HealthChange,
    HealthStatus, StatusChange)

app = FastAPI(title="QAGrid Environment Registry", version="1.0.0")

def find(environment_id: uuid.UUID, db: Session) -> Environment:
    item = db.get(Environment, environment_id)
    if item is None:
        raise HTTPException(404, "Environment not found")
    return item

def commit(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if getattr(exc.orig, "sqlstate", None) == "23505":
            raise HTTPException(409, "Environment name already exists") from exc
        raise

@app.get("/health/live")
def live():
    return {"status": "ok"}

@app.get("/health/ready")
def ready(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1 FROM environments LIMIT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(503, "Registry database unavailable") from exc
    return {"status": "ready"}

@app.post("/api/v1/environments", response_model=EnvironmentRead, status_code=status.HTTP_201_CREATED)
def create(payload: EnvironmentCreate, db: Session = Depends(get_db)):
    item = Environment(**payload.model_dump(mode="json"))
    db.add(item)
    commit(db)
    db.refresh(item)
    return item

@app.get("/api/v1/environments", response_model=EnvironmentList)
def list_environments(
    name: str | None = None,
    environment_type: EnvironmentType | None = None,
    operating_system: str | None = None,
    browser: str | None = None,
    status_filter: EnvironmentStatus | None = Query(default=None, alias="status"),
    health_status: HealthStatus | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    stmt = select(Environment)
    if name:
        stmt = stmt.where(Environment.name.ilike(f"%{name}%"))
    if environment_type:
        stmt = stmt.where(Environment.environment_type == environment_type.value)
    if operating_system:
        stmt = stmt.where(Environment.operating_system.ilike(f"%{operating_system}%"))
    if browser:
        stmt = stmt.where(Environment.browser.ilike(f"%{browser}%"))
    if status_filter:
        stmt = stmt.where(Environment.status == status_filter.value)
    if health_status:
        stmt = stmt.where(Environment.health_status == health_status.value)
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    items = db.scalars(stmt.order_by(Environment.name).limit(limit).offset(offset)).all()
    return {"items": items, "total": total, "limit": limit, "offset": offset}

@app.get("/api/v1/environments/available", response_model=EnvironmentList)
def available(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    stmt = select(Environment).where(
        Environment.status == "ACTIVE", Environment.health_status == "HEALTHY")
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    items = db.scalars(stmt.order_by(Environment.name).limit(limit).offset(offset)).all()
    return {"items": items, "total": total, "limit": limit, "offset": offset}

@app.get("/api/v1/environments/{environment_id}", response_model=EnvironmentRead)
def get_environment(environment_id: uuid.UUID, db: Session = Depends(get_db)):
    return find(environment_id, db)

@app.patch("/api/v1/environments/{environment_id}", response_model=EnvironmentRead)
def update(environment_id: uuid.UUID, payload: EnvironmentUpdate, db: Session = Depends(get_db)):
    item = find(environment_id, db)
    changes = payload.model_dump(exclude_unset=True, mode="json")
    if any(key in changes and changes[key] is None for key in ("name", "environment_type")):
        raise HTTPException(422, "name and environment_type cannot be null")
    for key, value in changes.items():
        setattr(item, key, value)
    item.updated_at = datetime.now(timezone.utc)
    commit(db)
    db.refresh(item)
    return item

@app.patch("/api/v1/environments/{environment_id}/status", response_model=EnvironmentRead)
def change_status(environment_id: uuid.UUID, payload: StatusChange, db: Session = Depends(get_db)):
    item = find(environment_id, db)
    item.status = payload.status.value
    if payload.status == EnvironmentStatus.UNDER_MAINTENANCE:
        item.maintenance_reason = payload.maintenance_reason.strip()
        item.maintenance_started_at = datetime.now(timezone.utc)
        item.maintenance_ends_at = payload.maintenance_ends_at
    else:
        item.maintenance_reason = None
        item.maintenance_started_at = None
        item.maintenance_ends_at = None
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return item

@app.patch("/api/v1/environments/{environment_id}/health", response_model=EnvironmentRead)
def change_health(environment_id: uuid.UUID, payload: HealthChange, db: Session = Depends(get_db)):
    item = find(environment_id, db)
    item.health_status = payload.health_status.value
    item.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    return item
