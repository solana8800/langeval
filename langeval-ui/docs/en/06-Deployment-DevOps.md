# 06. Deployment & DevOps Strategy
**Project**: Enterprise AI Agent Evaluation Platform
**Version**: 2.1 (IaC Enhanced)
**Status**: APPROVED

---

## 1. Infrastructure as Code (IaC) Strategy

All infrastructure is defined as code (Terraform/Pulumi) to ensure reproducibility and minimize human error.

### 1.1. Terraform Project Structure
```text
infrastructure/
├── modules/
│   ├── eks/
│   ├── rds/
│   └── clickhouse/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   └── variables.tf
│   └── prod/
│       ├── main.tf
│       └── variables.tf
└── scripts/
    └── k8s-bootstrap.sh
```

### 1.2. Example: EKS Cluster Provisioning
```hcl
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "ai-eval-platform-prod"
  cluster_version = "1.29"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # Managed Node Groups
  eks_managed_node_groups = {
    general = {
      min_size     = 1
      max_size     = 3
      desired_size = 2
      instance_types = ["t3.large"]
    }
    workers_spot = {
      min_size     = 2
      max_size     = 10
      desired_size = 2
      instance_types = ["c5.xlarge"]
      capacity_type  = "SPOT" # Cost Saving for Eval Workers
    }
  }
}
```

---

## 2. Application Deployment (Helm Charts)

Helm is used for application packaging. **GitOps** with **ArgoCD** is the recommended model.

### 2.1. Helm Chart Hierarchy
```text
charts/ai-eval-platform/
├── Chart.yaml
├── values.yaml (Default)
├── values-prod.yaml (Production overrides)
├── templates/
│   ├── orchestrator-deployment.yaml
│   ├── worker-deployment.yaml
│   ├── api-service.yaml
│   └── ingress.yaml
└── secrets/ (Sealed Secrets or External Secrets)
```

---

## 3. Secrets Management

Absolutely **NO** API Keys (OpenAI, Anthropic) should be stored in source code or Git.

*   **External Secrets Operator (ESO)**: Syncs secrets from AWS Secrets Manager to Kubernetes Secrets.
*   **Workflow**:
    1.  DevOps creates a secret in AWS Secrets Manager: `prod/eval-platform/llm-keys`.
    2.  ESO automatically creates a Kubernetes `Secret` named `llm-keys`.
    3.  Pods mount this secret as Environment Variables.

---

## 4. CI/CD Pipeline (GitHub Actions)

### 4.1. Quality Gate Workflow
Blocks Merge Requests if evaluation scores are too low.

```yaml
name: AI Quality Gate
on: [pull_request]

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Python
        uses: actions/setup-python@v4
        with: { python-version: '3.10' }
        
      - name: Run DeepEval Suite
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          deepeval test run tests/ --output-json report.json
          
      - name: Check Thresholds
        run: |
          # Block build if faithfulness < 0.9
          jq -e '.summary.faithfulness > 0.9' report.json      
```

---

## 5. Monitoring & Observability Dashboards

### 5.1. Grafana Panels Strategy
Three main dashboards should be built:

1.  **Platform Health (SRE Team)**
    *   **Orchestrator Uptime**: % of time the API is operational.
    *   **Queue Lag**: Number of pending jobs in Redis. Alarm if > 1000.
    *   **Worker Error Rate**: Rate of crashed/failed jobs.

2.  **LLM Cost & Performance (FinOps)**
    *   **Token Consumption**: Total daily tokens used (by Model).
    *   **Cost per Run**: Average cost per test run.
    *   **Latency P95**: LLM Provider response times.

3.  **AI Quality Trends (Product Team)**
    *   **Regression Tracker**: How Faithfulness scores change across builds.
    *   **Fail Topic Cluster**: Topics where the bot fails most frequently.

---

## 6. Production Checklist (Go-Live)

1.  [ ] **Resource Quotas**: Are Request/Limit set for all Pods?
2.  [ ] **HPA**: Is Autoscaling enabled for Workers?
3.  [ ] **Rate Limiting**: Is Backoff/Retry configured for OpenAI calls? (Avoid 429 errors).
4.  [ ] **Alerting**: Are Slack notifications set for Queue Lag > 5 minutes?
5.  [ ] **Backup**: Is Automated Backup enabled for RDS and S3?
