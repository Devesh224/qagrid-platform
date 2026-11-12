# Validation record

Date: 10 November 2026 (India time)

Completed in the source environment:
- Python 3.12 compileall: passed for both services and the end-to-end test file.
- Registry unit tests: 3 passed.
- Scheduler unit tests: 7 passed.
- OpenAPI generation: both applications imported and exposed 7 unique paths each.
- Docker Compose YAML: parsed, four services found.
- Kubernetes workload YAML: parsed, eight resources found.
- PostgreSQL schema SQL: both files parsed with pglast.
- PowerShell deployment script: parsed without errors.
- Postman collection: valid JSON, 12 ordered requests; requests not executed here.

Not run here:
- PostgreSQL connection, table creation, and real database transactions.
- End-to-end HTTP tests. They require running services and PostgreSQL.
- Docker image builds, Docker Compose health, Minikube rollout, Dashboard, and video.
- GitHub repository push.

Docker, Minikube, and PostgreSQL are not available in this source environment. The deployment PC must execute README.md steps and preserve actual output/screenshots. This record is a source check, not deployment evidence.
