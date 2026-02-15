# 06. Deployment & DevOps Strategy
**Project**: Enterprise AI Agent Evaluation Platform
**Version**: 2.1 (IaC Enhanced)
**Status**: APPROVED

---

## 1. Infrastructure as Code (IaC) Strategy

Toàn bộ hạ tầng được định nghĩa bằng mã (Terraform/Pulumi) để đảm bảo khả năng tái tạo (Reproducibility) và giảm thiểu lỗi con người.

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

Sử dụng Helm để đóng gói ứng dụng. Mô hình **GitOps** với **ArgoCD** được khuyến nghị.

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

### 2.2. Production Values Example (`values-prod.yaml`)
```yaml
orchestrator:
  replicaCount: 3
  resources:
    requests:
      cpu: "1000m"
      memory: "2Gi"
  
evalWorker:
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 20
    targetCPUUtilizationPercentage: 80
  env:
    # Secrets injection via Vault/AWS Secrets Manager
    OPENAI_API_KEY: "ref+aws-secrets://prod/openai-key"
```

---

## 3. Secrets Management

Tuyệt đối **KHÔNG** lưu API Key (OpenAI, Anthropic) trong source code hoặc git.

*   **External Secrets Operator (ESO)**: Sync secrets từ AWS Secrets Manager vào Kubernetes Secrets.
*   **Workflow**:
    1.  Devops tạo Secret trên AWS Secrets Manager: `prod/eval-platform/llm-keys`.
    2.  ESO tự động tạo `Secret` k8s tên `llm-keys`.
    3.  Pod mount secret này dưới dạng Environment Variables.

---

## 4. CI/CD Pipeline (GitHub Actions)

### 4.1. Quality Gate Workflow
Chặn Merge Request nếu điểm đánh giá thấp.

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
Cần xây dựng 3 dashboard chính:

1.  **Platform Health (SRE Team)**
    *   **Orchestrator Uptime**: % thời gian API hoạt động.
    *   **Queue Lag**: Số lượng jobs đang chờ trong Redis. Nếu > 1000 -> Alarm.
    *   **Worker Error Rate**: Tỷ lệ jobs bị crash/fail.

2.  **LLM Cost & Performance (FinOps)**
    *   **Token Consumption**: Tổng token dùng mỗi ngày (phân theo Model).
    *   **Cost per Run**: Chi phí trung bình cho 1 test run.
    *   **Latency P95**: Thời gian phản hồi của LLM Providers.

3.  **AI Quality Trends (Product Team)**
    *   **Regression Tracker**: Điểm số Faithfulness thay đổi thế nào qua các bản build?
    *   **Fail Topic Cluster**: Các chủ đề nào Bot hay trả lời sai nhất?

---

## 6. Production Checklist (Go-Live)

1.  [ ] **Resource Quotas**: Đã set Request/Limit cho tất cả Pods chưa?
2.  [ ] **HPA**: Đã bật Autoscaling cho Workers chưa?
3.  [ ] **Rate Limiting**: Đã cấu hình Backoff/Retry khi gọi OpenAI chưa? (Tránh lỗi 429).
4.  [ ] **Alerting**: Đã cài cảnh báo vào Slack khi Queue Lag > 5 phút chưa?
5.  [ ] **Backup**: Đã bật Automated Backup cho RDS và S3 chưa?
