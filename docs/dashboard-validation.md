# Dashboard validation record

Date: 11 November 2026 (Asia/Calcutta). This record describes commands actually run in this workspace. The tests use mocks unless stated otherwise.

## Completed locally

| Check | Command or method | Result |
| --- | --- | --- |
| Frontend dependencies | `npm.cmd install --no-audit --no-fund` in `frontend` | Completed; package lock written. |
| Frontend production build | `npm.cmd run build` in `frontend` | Passed TypeScript check and Vite build after final mobile layout change. Vite emitted two nonblocking third-party Zod comment warnings. |
| Frontend tests | `npm.cmd test -- --run` in `frontend` | 5 files, 14 tests passed. Mocked API responses; this is component/client verification. |
| Registry unit tests | `..\.venv\Scripts\python.exe -m pytest tests -q` in `environment-registry` | 3 passed. |
| Scheduler unit tests | `..\.venv\Scripts\python.exe -m pytest tests -q` in `reservation-scheduler` | 7 passed. |
| Compose syntax | Parsed `compose.yaml` with PyYAML | Passed; five services including frontend. |
| Kubernetes manifest syntax | Parsed `deploy/k8s/frontend.yaml` with PyYAML | Passed; Service and two-replica Deployment. |
| PowerShell deploy script syntax | PowerShell parser on `deploy/deploy.ps1` | Passed. |
| Desktop layout | Local headless Chrome at 1440 × 900 | Rendered Overview with unavailable states while backends were stopped. |
| Mobile layout | Local headless Chrome at 500 × 900 | Reservations page fit viewport, including alerts, filters, and pagination. Backends were stopped. The 430px screenshot was cropped by Chrome's headless minimum layout width and is not used as mobile evidence. |

The local Vite server showed service-unavailable states because Registry, Scheduler, and PostgreSQL were not running. No counts, sample rows, or successful bookings were invented for screenshots.

## Not yet verified

Docker, Docker Compose, Minikube, and Nginx were not installed on this Windows machine. Therefore the following remain deployment-system checks:

1. Build the frontend Docker image and start all five Compose services.
2. Confirm both backends are ready and the browser can reach them through Nginx at `http://localhost:3000/registry/health/ready` and `http://localhost:3000/scheduler/health/ready`.
3. Perform the real register → set health → reserve → overlap 409 → adjacent booking → cancel workflow in `frontend/README.md`. Record actual IDs and HTTP responses.
4. Run the existing real backend end-to-end checks and Postman collection with databases running, following `VALIDATION.md`.
5. Apply Kubernetes manifests through `deploy/deploy.ps1`; check both frontend replicas and the two backend Services.
6. Port-forward frontend and both Swagger Services, repeat the real workflow, and capture actual populated-dashboard screenshots.

Do not mark any of these as passed until they run on the deployment computer. The UI has no authentication because the existing backend has none.

## Source archive

`make_zip.py` packages frontend source, both independent backend services, Compose, Kubernetes, documentation, and tests. It excludes `node_modules`, `dist`, local browser QA profiles, and temporary QA screenshots. Rebuild the archive after any source change.


