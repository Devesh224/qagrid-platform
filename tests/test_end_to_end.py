"""Run only after docker compose up -d --build or Kubernetes port forwarding."""
import os
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
import httpx

REGISTRY = os.getenv("REGISTRY_TEST_URL", "http://localhost:8001")
SCHEDULER = os.getenv("SCHEDULER_TEST_URL", "http://localhost:8002")

def make_environment():
    response = httpx.post(
        f"{REGISTRY}/api/v1/environments",
        json={"name": f"QA-{uuid.uuid4()}", "environment_type": "BROWSER",
              "platform": "Desktop", "operating_system": "Windows 11",
              "browser": "Chrome"},
        timeout=10,
    )
    assert response.status_code == 201, response.text
    environment_id = response.json()["environment_id"]
    response = httpx.patch(
        f"{REGISTRY}/api/v1/environments/{environment_id}/health",
        json={"health_status": "HEALTHY"}, timeout=10,
    )
    assert response.status_code == 200, response.text
    return environment_id

def booking(environment_id, start, end):
    return {
        "environment_id": environment_id,
        "requester": "qa@example.com",
        "purpose": "Regression test",
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
    }

def post_booking(body):
    return httpx.post(f"{SCHEDULER}/api/v1/reservations", json=body, timeout=15)

def test_booking_rules_and_service_collaboration():
    environment_id = make_environment()
    start = datetime.now(timezone.utc) + timedelta(days=1)
    end = start + timedelta(hours=1)
    first = post_booking(booking(environment_id, start, end))
    assert first.status_code == 201, first.text
    overlapping = post_booking(booking(environment_id, start + timedelta(minutes=30), end + timedelta(minutes=30)))
    assert overlapping.status_code == 409, overlapping.text
    adjacent = post_booking(booking(environment_id, end, end + timedelta(hours=1)))
    assert adjacent.status_code == 201, adjacent.text
    cancelled = httpx.patch(
        f"{SCHEDULER}/api/v1/reservations/{first.json()['reservation_id']}/cancel", timeout=10)
    assert cancelled.status_code == 200, cancelled.text
    replacement = post_booking(booking(environment_id, start, end))
    assert replacement.status_code == 201, replacement.text
    maintenance = httpx.patch(
        f"{REGISTRY}/api/v1/environments/{environment_id}/status",
        json={"status": "UNDER_MAINTENANCE", "maintenance_reason": "Upgrade"},
        timeout=10,
    )
    assert maintenance.status_code == 200, maintenance.text
    blocked = post_booking(booking(environment_id, end + timedelta(hours=2), end + timedelta(hours=3)))
    assert blocked.status_code == 409, blocked.text
    listed = httpx.get(f"{SCHEDULER}/api/v1/reservations", params={"requester": "qa@example.com"}, timeout=10)
    assert listed.status_code == 200 and listed.json()["total"] >= 3

def test_concurrent_overlapping_requests_allow_only_one():
    environment_id = make_environment()
    start = datetime.now(timezone.utc) + timedelta(days=2)
    body = booking(environment_id, start, start + timedelta(hours=1))
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(post_booking, [body, body]))
    assert sorted(response.status_code for response in results) == [201, 409], [r.text for r in results]
