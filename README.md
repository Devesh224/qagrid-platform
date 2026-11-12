# QAGrid source handoff

QAGrid is a QA test environment registry and reservation scheduler for the BITS Pilani SEZG583 Scalable Services assignment. Four services are designed; two are implemented. Read docs/system-design.md for the architecture, contracts, and schema.

## Folder layout

- environment-registry: independent FastAPI service, database schema, Dockerfile, unit tests
- reservation-scheduler: independent FastAPI service, database schema, Dockerfile, unit tests
- frontend: React/TypeScript dashboard with its own Dockerfile and tests
- compose.yaml: dashboard, two API containers and two PostgreSQL containers
- deploy: Minikube manifests and PowerShell deployment script
- tests: HTTP end-to-end tests, including concurrent booking

The two service folders are intended to become separate Git repositories. The root is a portable deployment bundle.

## Step 1: validate tools on the deployment Windows 11 PC

Open PowerShell in this folder:

    py -3.12 --version
    git --version
    docker version
    docker compose version
    minikube version

Install missing tools before continuing. Docker Desktop should use Linux containers and may require WSL 2 and a reboot.

## Step 2: build and run with Docker Compose

    docker compose up -d --build
    docker compose ps
    Invoke-RestMethod http://localhost:8001/health/ready
    Invoke-RestMethod http://localhost:8002/health/ready

Compose reads QAGRID_REGISTRY_DB_PASSWORD and QAGRID_SCHEDULER_DB_PASSWORD from the root .env file. That ignored file is included for this local demo; replace its values for your own use. The first command builds the two API images and frontend image and starts five containers. The second shows their state. Readiness checks connect to each service's own database. Open the dashboard at http://localhost:3000 and the interactive API pages at http://localhost:8001/docs and http://localhost:8002/docs. See frontend/README.md for the UI workflow and local Vite setup. Import postman/QAGrid.postman_collection.json into Postman and run its requests in order for the demonstration.

New environments start with UNKNOWN health. Change health to HEALTHY before booking. Use future timestamps including a timezone such as +05:30.

## Step 3: run tests

    py -3.12 -m venv .venv
    .\.venv\Scripts\python.exe -m pip install -r .\environment-registry\requirements.txt
    cd environment-registry
    ..\.venv\Scripts\python.exe -m pytest tests -q
    cd ..\reservation-scheduler
    ..\.venv\Scripts\python.exe -m pytest tests -q
    cd ..
    .\.venv\Scripts\python.exe -m pytest tests -q

The service tests check input validation and Registry communication. Root tests call the running containers, including two simultaneous booking attempts. Save actual output. Do not claim a test passed until you run it.

## Step 4: deploy to Minikube

Keep Docker Desktop running in Linux-container mode. The deployment script also builds and deploys the dashboard:

    .\deploy\deploy.ps1

The script starts Minikube, builds and loads images, creates database schemas and Secrets, applies Kubernetes resources, waits for readiness, and lists workloads. Before running it, set QAGRID_REGISTRY_DB_PASSWORD and QAGRID_SCHEDULER_DB_PASSWORD in the current PowerShell session; the script stops with a clear message if either is missing. Compose reads the same names from the root .env file, but the deployment script does not load that file. Use private values for any shared or non-local deployment. If the PowerShell execution policy blocks it, use:

    powershell -ExecutionPolicy Bypass -File .\deploy\deploy.ps1

Inspect and capture:

    minikube kubectl -- -n qagrid get pods,deployments,statefulsets,services,pvc
    minikube kubectl -- -n qagrid describe deployment scheduler
    minikube dashboard

In two additional PowerShell windows, keep these commands running to access services from Windows:

    minikube kubectl -- -n qagrid port-forward service/registry 8001:8000
    minikube kubectl -- -n qagrid port-forward service/scheduler 8002:8000

In a third terminal run minikube kubectl -- -n qagrid port-forward service/frontend 3000:80 and open http://localhost:3000. Rerun the root end-to-end tests through the API port forwards. The database initialization SQL runs only with a fresh empty volume. Reapplying a ConfigMap does not change an existing database schema.

## Step 5: assignment evidence

Capture actual screenshots of:
1. Postman environment creation, health update, environment list.
2. Reservation 201; overlapping 409; adjacent 201; cancellation and rebooking.
3. Invalid timestamps 422 and missing environment 404. Demonstrate 503 only if you intentionally stop Registry and capture the result.
4. Docker Compose containers, test output, Kubernetes Pods, Deployments, Services, PVCs, and Dashboard showing ready replicas.
5. A screen recording showing the deployed services and working API calls.

The final documentation must include member details, application description, architecture diagram, operations and service mapping, project structure, deployment plan, execution commands, two GitHub repository links, actual snapshots, and Dashboard analysis. The assignment requires one ZIP named with student ID and application name. Add the finished document and demo video before submitting.

## Step 6: publish two repositories

In the deployment system, run Git commands separately inside environment-registry and reservation-scheduler:

    git init
    git add .
    git commit -m "Implement QAGrid service"

Create one empty GitHub repository for each folder, then use GitHub's displayed remote and push commands. The root bundle does not need a third repository.

## Operational notes

Database passwords are read from QAGRID_REGISTRY_DB_PASSWORD and QAGRID_SCHEDULER_DB_PASSWORD. The root .env contains local demo values and is ignored by Git; never use those demo values for a shared or non-local deployment. The .env.example files contain placeholders only. For Registry 503 errors, inspect its health and the Scheduler REGISTRY_BASE_URL. For database issues, inspect Docker Compose or Kubernetes pod logs. For image pull errors, rerun minikube image load and check imagePullPolicy IfNotPresent.

## Dashboard source checks

From frontend run npm ci, npm test, and npm run build. See docs/dashboard-implementation-plan.md and docs/dashboard-validation.md for the phase plan and the actual checks performed. Frontend unit tests use mocked responses and are separate from real backend integration evidence. The frontend is a separate source directory; do not add it to either backend Git repository.

