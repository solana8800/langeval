# 07. Security & Compliance Framework

## 1. Security Architecture Layers

Security is designed following the "Defense in Depth" model:

| Layer | Measures | Technology |
|-------|----------|------------|
| **Edge** | WAF, DDoS Protection, Rate Limiting | Cloudflare / AWS WAF |
| **Network** | VPC Peering, Private Subnets, mTLS (Internal) | Istio Service Mesh |
| **Application** | JWT Auth, Input Validation, Sanitization | API Gateway (Kong) |
| **Data** | Encryption at Rest (AES-256), Encryption in Transit (TLS 1.3) | Database internal Enc |
| **Audit** | Access Logs, Audit Trails | Elastic Security / Splunk |
| **Container** | Vulnerability Scanning, Image Hardening | Trivy Security Scanner |

---

## 2. PII Protection & Data Privacy (GDPR)

Since the system handles sensitive conversation data, privacy is a top priority.

### 2.1. PII Redaction Pipeline
Before data is stored in the database or sent for LLM evaluation, it passes through a `PII Masker`.
*   **Detector**: Uses Microsoft Presidio or regex patterns.
*   **Action**: Masking (replaced by `***`) or Hashing.
*   **Scope**: Emails, Phone numbers, Credit Cards, SSNs.

```json
// Before
"My phone number is 0901234567"
// After
"My phone number is <PHONE_NUMBER>"
```

### 2.2. Data Residency & Retention
*   Optional data storage in specific regions (EU/US/APAC).
*   **Retention Policy**: Automatic deletion of Raw logs after 90 days (configurable), retaining only aggregated metrics.

---

## 3. Authentication & RBAC

Utilizes a centralized IAM model.

### 3.1. Roles Definition
*   **Platform Admin**: Full system access, billing management.
*   **Tenant Admin**: Manages users within an organization, configures API keys.
*   **Developer**: Views reports, creates projects, integrates SDKs.
*   **Auditor**: Read-only access to logs and compliance reports.

### 3.2. API Security
*   **API Keys**: Rotating keys, scoped by Project.
*   **Webhook Signature**: Payload signing using HMAC-SHA256 to verify request origins.

---

## 4. LLM Safety Guardrails

Ensures the evaluation system itself is not compromised by jailbreaks or bias.

*   **Input Scanning**: Checks for Prompt Injection before entering the evaluation pipeline using `Rebuff` or `NeMo Guardrails`.
*   **Output Validation**: Validates LLM Judge output format. Falls back to rule-based metrics and alerts developers if formatting fails consistently.

---

## 5. Container Security & Vulnerability Management

### 5.1. Trivy Security Scanning
The system uses **Trivy** (Aqua Security) to scan vulnerabilities in Docker images for all backend services.

#### Automated Scanning Process
```bash
# Scan all backend services
bash backend/tests/security_scan.sh

# Scan with custom severity levels
bash backend/tests/security_scan.sh --severity CRITICAL,HIGH,MEDIUM
```

#### Scanned Services:
1. `backend-orchestrator`
2. `backend-simulation-worker`
3. `backend-evaluation-worker`
4. `backend-identity-service`
5. `backend-resource-service`
6. `backend-gen-ai-service`
7. `backend-data-ingestion`

#### Severity Levels & Response

| Severity | Description | Action Required |
|----------|-------------|----------------|
| 🔴 **CRITICAL** | Extremely severe vulnerability; immediate exploit risk | **Immediate fix** - Block deployment |
| 🟠 **HIGH** | Severe vulnerability | Fix within 7 days |
| 🟡 **MEDIUM** | Moderate vulnerability | Fix in the next sprint |
| 🟢 **LOW** | Minor vulnerability | Track and fix when possible |

---

## 6. Compliance Checklist

### Security Controls Implemented
- [x] **Container Vulnerability Scanning**: Trivy automated scanning for all images.
- [x] **Redis Authentication**: Password-protected Redis instances.
- [x] **Secrets Management**: Environment variables for sensitive data.
- [ ] **SOC 2 Type II**: Audit logging for all system configuration changes.
- [ ] **HIPAA**: Requires BAA with LLM providers (Azure OpenAI) for medical data processing.
- [ ] **GDPR**: Supports "Right to be Forgotten" via API.

---

## 10. References
*   [Trivy Documentation](https://aquasecurity.github.io/trivy/)
*   [OWASP Top 10](https://owasp.org/www-project-top-ten/)
*   [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
