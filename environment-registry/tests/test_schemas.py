import pytest
from pydantic import ValidationError
from app.schemas import EnvironmentCreate, StatusChange

def test_environment_name_is_trimmed():
    item = EnvironmentCreate(name="  Chrome-Windows-01  ", environment_type="BROWSER")
    assert item.name == "Chrome-Windows-01"

def test_blank_name_is_rejected():
    with pytest.raises(ValidationError):
        EnvironmentCreate(name="  ", environment_type="BROWSER")

def test_maintenance_requires_reason():
    with pytest.raises(ValidationError):
        StatusChange(status="UNDER_MAINTENANCE")
