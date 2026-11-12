# QAGrid system design

## Assignment scope

Design is worth 6 marks, implementation 7, and deployment 7. The assignment requires operations, capabilities, service mapping and collaboration, two implemented services in separate repositories, separate Docker containers, Minikube deployment, Dashboard analysis, screenshots, GitHub URLs, a demonstration video, and one submission ZIP. Test Execution and Notification remain design-only extensions.

## Problem and core use case

QA engineers share limited test environments. They need to find an operational environment and reserve an exclusive time interval. QAGrid rejects overlapping bookings and prevents reservations for inactive, unhealthy, or maintained environments.

## Capabilities and operations

| Capability | Service | Commands | Queries | Implemented |
|---|---|---|---|---|
| Environment catalog | Registry | Register, update details, change status, change health | List/filter, get ID, operational readiness | Yes |
| Time slot scheduling | Scheduler | Create, cancel, complete | List/filter, get ID, check time slot | Yes |
| Automated test execution | Test Execution | Submit/cancel execution | Status/history | Design only |
| Communications | Notification | Send confirmation/cancellation/reminder | Delivery status | Design only |

## Architecture diagram

~~~mermaid
flowchart LR
    QA[QA engineer or Postman] --> ER[Environment Registry API]
    QA --> RS[Reservation Scheduler API]
    RS -->|HTTP lookup| ER
    ER --> EDB[(Registry PostgreSQL)]
    RS --> RDB[(Scheduler PostgreSQL)]
    RS -. future events .-> NS[Notification Service design only]
    RS -. future requests .-> TS[Test Execution Service design only]
~~~

Future extensions: Scheduler can publish reservation events to Notification and request work from Test Execution. Neither extension is implemented in this assignment.

For Kubernetes, each API has a two-replica Deployment and ClusterIP Service. Each database is a separate one-replica StatefulSet with persistent storage. This is a local teaching deployment, not a production high-availability database.

## Collaboration and consistency

Scheduler validates the request, calls Registry over HTTP with a two-second timeout, and requires a matching ID with ACTIVE and HEALTHY status. It checks its own database and inserts the booking. A PostgreSQL exclusion constraint is the final concurrency guard. Two overlapping confirmed inserts for one environment cannot both commit.

Intervals are half-open: [start_time, end_time). Overlap means existing start < requested end AND existing end > requested start. Adjacent slots are allowed. Cancelled or completed bookings do not block. An availability GET is advisory; the POST transaction decides the booking result.

Registry status can change after Scheduler's lookup. There is no distributed transaction. Existing reservations are not automatically cancelled when maintenance begins. A future version could notify affected engineers.

## API contracts

All application routes are versioned under /api/v1. Both services expose /health/live and /health/ready. IDs are UUIDs, timestamps require ISO 8601 timezone information, and /docs exposes OpenAPI.

| Registry route | Input | Success | Errors |
|---|---|---|---|
| POST /environments | name, type, optional platform/OS/browser | 201 environment | 409 duplicate, 422 invalid |
| GET /environments | filters and limit/offset | 200 paged list | 422 |
| GET /environments/available | limit/offset | 200 ACTIVE and HEALTHY list | 422 |
| GET /environments/{id} | UUID | 200 environment | 404 |
| PATCH /environments/{id} | editable details | 200 environment | 404/409/422 |
| PATCH /environments/{id}/status | status, maintenance reason/end | 200 environment | 404/422 |
| PATCH /environments/{id}/health | health_status | 200 environment | 404/422 |

The Registry available route checks operational readiness, not a time slot.

| Scheduler route | Input | Success | Errors |
|---|---|---|---|
| POST /reservations | environment_id, requester, purpose, start/end | 201 reservation | 404/409/422/503 |
| GET /reservations | filters and limit/offset | 200 paged list | 422 |
| GET /reservations/availability | environment_id, start/end | 200 available boolean | 404/409/422/503 |
| GET /reservations/{id} | UUID | 200 reservation | 404 |
| PATCH /reservations/{id}/cancel | UUID | 200 reservation | 404/409 |
| PATCH /reservations/{id}/complete | UUID | 200 reservation | 404/409 |

FastAPI validation errors use its standard detail response. Scheduler maps PostgreSQL exclusion SQLSTATE 23P01 to HTTP 409.

## Database schema

The canonical DDL is in each service's db/schema.sql. Registry owns environments with UUID ID, unique name, type, platform, OS, browser, status, health, maintenance metadata, and timestamps. Scheduler owns reservations with UUID ID, logical environment ID, requester, purpose, start/end times, status, and timestamps. There is no cross-database foreign key.

Scheduler uses btree_gist and a partial GiST exclusion constraint over environment_id and tstzrange(start_time, end_time, '[)') for CONFIRMED rows. This enforces the booking rule under concurrency. Each service also has list/filter indexes.

## Validation and deployment plan

1. Unit tests: input schema checks and Registry client handling.
2. Docker Compose: two API and two database containers, readiness probes, real HTTP tests.
3. End-to-end tests: creation, overlap, adjacency, cancellation, maintenance, filtering, concurrent requests.
4. Minikube: build and load images, apply two StatefulSets and two Deployments, verify ready replicas and port-forwarded calls.
5. Capture real Postman, command, test, Dashboard, and video evidence; publish two repositories; assemble final submission ZIP.

The API can scale horizontally because it keeps no booking state in process memory. Scheduler replicas share one database whose exclusion constraint protects conflicts. Authentication, database high availability, and event-driven notifications are future improvements.

## Dashboard extension

The React dashboard is a separate frontend directory. In development, Vite proxies browser requests at /registry and /scheduler to the local API ports 8001 and 8002. In Docker and Kubernetes, Nginx serves the frontend and proxies the same paths to the Registry and Scheduler service names on the container network. The browser therefore uses one origin and does not need to resolve internal service DNS names. API traffic still reaches only the existing FastAPI services; the dashboard has no database connection.

~~~mermaid
flowchart LR
    Browser[Browser] --> Frontend[React dashboard on Nginx]
    Frontend -->|/registry| Registry[Registry API]
    Frontend -->|/scheduler| Scheduler[Scheduler API]
    Scheduler -->|HTTP validation| Registry
    Registry --> RegistryDB[(Registry PostgreSQL)]
    Scheduler --> SchedulerDB[(Scheduler PostgreSQL)]
~~~

The frontend is a fifth Compose container and has its own two-replica Kubernetes Deployment plus ClusterIP Service. On Windows, a Minikube port-forward exposes the frontend on localhost:3000. Swagger documentation links need separate Registry and Scheduler port forwards in Kubernetes.
