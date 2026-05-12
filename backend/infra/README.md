# Infrastructure Artifacts

This folder captures the non-runtime parts of the nine-section ZENVY backend document:

- `postgres/`: Patroni, HAProxy, and PgBouncer examples for PostgreSQL HA
- `k8s/`: Kubernetes deployment, HPA, PDB, Istio canary routing, network policy, and ArgoCD app
- `../observability/`: OpenTelemetry collector, alerting, and Grafana dashboard seed

These files are reference-grade scaffolds for production infrastructure and are intentionally separate from the local Node runtime.
