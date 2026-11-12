$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

$registryPassword = $env:QAGRID_REGISTRY_DB_PASSWORD
$schedulerPassword = $env:QAGRID_SCHEDULER_DB_PASSWORD
if ([string]::IsNullOrWhiteSpace($registryPassword)) {
    throw "QAGRID_REGISTRY_DB_PASSWORD is required. Set it in this PowerShell session before running deploy.ps1."
}
if ([string]::IsNullOrWhiteSpace($schedulerPassword)) {
    throw "QAGRID_SCHEDULER_DB_PASSWORD is required. Set it in this PowerShell session before running deploy.ps1."
}
$registryUrl = "postgresql+psycopg://registry:" + $registryPassword + "@registry-db.qagrid.svc.cluster.local:5432/registry"
$schedulerUrl = "postgresql+psycopg://scheduler:" + $schedulerPassword + "@scheduler-db.qagrid.svc.cluster.local:5432/scheduler"

minikube start --driver=docker
if ($LASTEXITCODE -ne 0) { throw "minikube start failed" }
docker build -t qagrid-registry:1.0 ./environment-registry
if ($LASTEXITCODE -ne 0) { throw "Registry image build failed" }
docker build -t qagrid-scheduler:1.0 ./reservation-scheduler
if ($LASTEXITCODE -ne 0) { throw "Scheduler image build failed" }
docker build -t qagrid-frontend:1.0 ./frontend
if ($LASTEXITCODE -ne 0) { throw "Frontend image build failed" }
minikube image load qagrid-registry:1.0
if ($LASTEXITCODE -ne 0) { throw "Registry image load failed" }
minikube image load qagrid-scheduler:1.0
if ($LASTEXITCODE -ne 0) { throw "Scheduler image load failed" }
minikube image load qagrid-frontend:1.0
if ($LASTEXITCODE -ne 0) { throw "Frontend image load failed" }

minikube kubectl -- apply -f deploy/k8s/namespace.yaml
if ($LASTEXITCODE -ne 0) { throw "Namespace apply failed" }
minikube kubectl -- -n qagrid create configmap registry-schema --from-file=01-schema.sql=environment-registry/db/schema.sql --dry-run=client -o yaml | minikube kubectl -- apply -f -
if ($LASTEXITCODE -ne 0) { throw "Registry schema ConfigMap failed" }
minikube kubectl -- -n qagrid create configmap scheduler-schema --from-file=01-schema.sql=reservation-scheduler/db/schema.sql --dry-run=client -o yaml | minikube kubectl -- apply -f -
if ($LASTEXITCODE -ne 0) { throw "Scheduler schema ConfigMap failed" }
minikube kubectl -- -n qagrid create secret generic registry-db-secret --from-literal=password=$registryPassword --from-literal=database-url=$registryUrl --dry-run=client -o yaml | minikube kubectl -- apply -f -
if ($LASTEXITCODE -ne 0) { throw "Registry secret failed" }
minikube kubectl -- -n qagrid create secret generic scheduler-db-secret --from-literal=password=$schedulerPassword --from-literal=database-url=$schedulerUrl --dry-run=client -o yaml | minikube kubectl -- apply -f -
if ($LASTEXITCODE -ne 0) { throw "Scheduler secret failed" }

minikube kubectl -- apply -f deploy/k8s/workloads.yaml
if ($LASTEXITCODE -ne 0) { throw "Workload apply failed" }
minikube kubectl -- apply -f deploy/k8s/frontend.yaml
if ($LASTEXITCODE -ne 0) { throw "Frontend apply failed" }
minikube kubectl -- -n qagrid rollout status statefulset/registry-db --timeout=180s
if ($LASTEXITCODE -ne 0) { throw "Registry database not ready" }
minikube kubectl -- -n qagrid rollout status statefulset/scheduler-db --timeout=180s
if ($LASTEXITCODE -ne 0) { throw "Scheduler database not ready" }
minikube kubectl -- -n qagrid rollout status deployment/registry --timeout=180s
if ($LASTEXITCODE -ne 0) { throw "Registry not ready" }
minikube kubectl -- -n qagrid rollout status deployment/scheduler --timeout=180s
if ($LASTEXITCODE -ne 0) { throw "Scheduler not ready" }
minikube kubectl -- -n qagrid rollout status deployment/frontend --timeout=180s
if ($LASTEXITCODE -ne 0) { throw "Frontend not ready" }
minikube kubectl -- -n qagrid get pods,services,deployments,statefulsets
