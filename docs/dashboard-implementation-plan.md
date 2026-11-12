# QAGrid Dashboard Implementation Plan

Prepared 11 November 2026. This plan follows the actual source code in this workspace. No GitHub push is authorized.

## Current project facts

- Registry and Scheduler are separate FastAPI services with separate PostgreSQL databases. Test Execution and Notification have no APIs.
- Registry browser port is 8001; Scheduler browser port is 8002 in Compose. Both container ports are 8000.
- Both expose /health/live and /health/ready. Readiness queries the service's own database table.
- List APIs return items, total, limit, offset; limits are 1 to 100. The backend has no aggregate metrics API.
- Registry statuses are ACTIVE, INACTIVE, UNDER_MAINTENANCE. Health values are HEALTHY, UNHEALTHY, UNKNOWN. New environments start UNKNOWN.
- Reservation statuses are CONFIRMED, CANCELLED, COMPLETED. A reservation requires a future timezone-aware interval, requester, purpose, and an ACTIVE/HEALTHY environment.
- The backend has no authentication layer and no CORS middleware.
- The frontend must not connect to PostgreSQL or implement authoritative booking conflict logic.

## Browser routing decision

The frontend will call same-origin /registry and /scheduler paths. Vite proxies them to localhost:8001 and localhost:8002 during development. Nginx proxies them to the backend container Services in Docker Compose and Kubernetes. This avoids backend CORS edits and avoids browser requests to unresolvable Docker or Kubernetes service names. .env.example documents the frontend API path variables. Settings may override browser-facing paths for troubleshooting, but will not expose database credentials.

## Phases and verification gates

1. Foundation: React, TypeScript, Vite, MUI, Router, Axios, Recharts, React Hook Form, Zod, Day.js, Vitest and RTL. Create types from actual schemas, API clients, error mapping, theme, layout, Vite proxy and Nginx template. Gate: dependency install, TypeScript check, production build, API-client tests.
2. Overview and Environments: navigation, live KPIs, distribution charts, recent environments, list/filter/pagination, details, create/edit/status/health forms. Use all pages when deriving metrics. Gate: component tests for loading, empty, populated, errors and form validation.
3. Reservations: list/filter/details, available environment selection, future timezone-aware date/time form, advisory availability query, create/cancel/complete actions. Gate: validation, conflict, unavailable Registry and success tests. The Scheduler remains authoritative.
4. Health, Docs and Settings: readiness/liveness polling, Swagger links, theme choice and browser API path settings. Gate: health unavailable and polling tests, build.
5. Docker: frontend multi-stage image and root Compose service on localhost:3000. Gate here: configuration parse and build if Docker exists. Gate on deployment PC: image build, running frontend, both API calls through Nginx, backend health.
6. Kubernetes: separate frontend Deployment and ClusterIP Service, frontend proxy to existing backend Services, port-forward instructions. Gate here: manifest syntax. Gate on deployment PC: rollout, frontend/API access, real UI operations and Dashboard screenshot.
7. Final verification and documentation: all frontend tests/build, existing backend unit tests, actual end-to-end tests where services run; update root/frontend README and validation record. Do not report live integration as passed without running it. No automatic Git commit or push.

## Metrics rule

Environment totals and status/health counts, reservation status counts, upcoming reservations and recent environments must come from successful API responses. The list APIs have no date filters or server aggregates; the frontend will fetch all pages for derived metrics. If any required page fails, that metric section shows unavailable rather than a partial count. No trend chart will be invented.

## Files to create or change

Create frontend/ with src/app, components, pages/features, services/api, types, theme, tests, public, Vite config, Nginx template, Dockerfile, .env.example and README. Add only a frontend service to compose.yaml. Add deploy/k8s/frontend.yaml and update deployment instructions. Preserve both backend source trees and existing evidence files.

## Practical limits

Node and npm are present locally. Docker and Minikube were not found on PATH during inspection. Frontend build and isolated tests can run here. Real PostgreSQL-backed UI operations, Compose and Kubernetes must be verified on a system running those services.
