# QAGrid Dashboard

React, TypeScript, Vite and Material UI frontend for the existing QAGrid Registry and Scheduler APIs. Test Execution and Notification remain design-only services.

## Prerequisites

Windows 11 with Node.js 22.12 or later and npm. The backend services and their two PostgreSQL databases must be running for live data. The dashboard has no direct database connection.

## Local development

From the project root, start the backend containers if Docker is available:

    docker compose up -d registry-db scheduler-db registry scheduler

From frontend in another PowerShell window:

    npm ci
    npm run dev

Open http://localhost:5173. Vite proxies /registry to localhost:8001 and /scheduler to localhost:8002. The browser makes same-origin requests, so backend CORS changes are not needed. If the backend is stopped, Overview and other pages show unavailable states; that is not evidence of a working integration.

Optional: copy .env.example to .env.local and adjust browser-facing paths and Swagger URLs. Do not put database URLs or secrets in Vite variables; Vite embeds these variables in browser code.

## Tests and build

    npm test
    npm run build

Tests use mocked API responses to verify UI behavior. They do not prove real PostgreSQL-backed API integration. The production build writes dist/, which is excluded from Git and the source ZIP.

## Real workflow to verify

1. Open Environments. Register a BROWSER environment. The backend starts health as UNKNOWN.
2. Use the Health action to set it to HEALTHY. Keep status ACTIVE.
3. Open Reservations. Create a future booking with requester, purpose, environment, start and end times. The UI converts local date/time to timezone-aware ISO 8601.
4. Use Check availability if desired. Its result is advisory. Submit and record the actual reservation ID.
5. Try an overlapping slot; the Scheduler should return 409 and its detail should be shown. Try an adjacent slot; it should succeed.
6. Cancel a confirmed reservation through the confirmation dialog and verify that its slot can be booked again.
7. Open System Health, then stop one backend service and confirm that the page reports it unavailable without crashing.
8. Capture real screenshots only after these actions succeed.

The Overview metrics and charts are derived from all pages of API data. The backend has no aggregate or historical metrics endpoint, so the dashboard does not show invented trends. For very large data sets, server-side aggregate endpoints would be a future improvement.

## Docker Compose

From the root:

    docker compose up -d --build
    docker compose ps

Open http://localhost:3000. Nginx serves the built frontend and proxies /registry and /scheduler to the two API containers. The original four backend/database containers remain; frontend is the fifth container. Swagger is linked directly at http://localhost:8001/docs and http://localhost:8002/docs.

## Minikube

From the root, after Docker Desktop and Minikube are installed:

    .\deploy\deploy.ps1
    minikube kubectl -- -n qagrid get pods,deployments,services,pvc

The script builds and loads the frontend image and applies deploy/k8s/frontend.yaml in addition to the existing backend manifests. It expects two frontend replicas. Expose the dashboard to the Windows browser in a terminal kept open:

    minikube kubectl -- -n qagrid port-forward service/frontend 3000:80

Open http://localhost:3000. Nginx inside the frontend Pod resolves Registry and Scheduler Kubernetes Services, while the browser only contacts localhost:3000. To open Swagger links, keep these separate port forwards open too:

    minikube kubectl -- -n qagrid port-forward service/registry 8001:8000
    minikube kubectl -- -n qagrid port-forward service/scheduler 8002:8000

Run the real workflow and backend end-to-end tests before claiming the Kubernetes deployment works. Capture actual Dashboard evidence.

## Settings and limitations

The Settings page offers light/dark theme and browser API paths. Defaults are /registry and /scheduler. Absolute overrides need to be reachable by the browser and may need CORS. The current backend has no authentication. Database availability is inferred only from each backend readiness endpoint. Existing reservations are not automatically cancelled when an environment changes to maintenance.
