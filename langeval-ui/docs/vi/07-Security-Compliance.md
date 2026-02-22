# 07. Security & Compliance Framework

## 1. Security Architecture Layers

Bảo mật được thiết kế theo mô hình "Defense in Depth" (Phòng thủ chiều sâu):

| Layer | Measures | Technology |
|-------|----------|------------|
| **Edge** | WAF, DDoS Protection, Rate Limiting | Cloudflare / AWS WAF |
| **Network** | VPC Peering, Private Subnets, mTLS (Internal) | Istio Service Mesh |
| **Application** | JWT Auth, Input Validation, Sanitization | API Gateway (Kong) |
| **Data** | Encryption at Rest (AES-256), Encryption in Transit (TLS 1.3) | Database internal Enc |
| **Audit** | Access Logs, Audit Trails | Elastic Security / Splunk |
| **Container** | Vulnerability Scanning, Image Hardening | Trivy Security Scanner |

## 2. PII Protection & Data Privacy (GDPR)

Hệ thống xử lý dữ liệu hội thoại nhạy cảm, nên Privacy là ưu tiên hàng đầu.

### 2.1. PII Redaction Pipeline
Trước khi lưu vào Database hoặc gửi đi LLM Eval, dữ liệu phải qua bộ lọc `PII Masker`.
*   **Detector**: Sử dụng Presidio (Microsoft) hoặc regex patterns.
*   **Action**: Masking (thay thế bằng `***`) hoặc Hashing.
*   **Scope**: Email, Phone, Credit Card, SSN.

```json
// Before
"My phone number is 0901234567"
// After
"My phone number is <PHONE_NUMBER>"
```

### 2.2. Data Residency & Retention
*   Cung cấp tùy chọn lưu trữ dữ liệu tại Region cụ thể (EU/US/APAC).
*   **Retention Policy**: Tự động xóa Raw logs sau 90 ngày (configurable), chỉ giữ lại Metrics report tổng hợp.

## 3. Authentication & RBAC

Sử dụng mô hình IAM tập trung.

### 3.1. Roles Definition
*   **Platform Admin**: Full access hệ thống, quản lý billing.
*   **Tenant Admin**: Quản lý users trong organization, config API keys.
*   **Developer**: Xem reports, tạo projects, tích hợp SDK.
*   **Auditor**: Chỉ xem logs và compliance reports (Read-only).

### 3.2. API Security
*   **API Keys**: Rotating keys, scope giới hạn theo Project.
*   **Webhook Signature**: Ký payload bằng HMAC-SHA256 để verify nguồn gốc request từ Platform gửi về Client.

## 4. LLM Safety Guardrails

Để đảm bảo chính hệ thống Eval không bị tấn công (Jailbreak) hoặc bias.

*   **Input Scanning**: Kiểm tra Prompt Injection trước khi đưa vào Evaluation Pipeline. Sử dụng `Rebuff` hoặc `NeMo Guardrails`.
*   **Output Validation**: Kiểm tra metrics output của LLM Judge. Nếu LLM trả về format sai liên tục -> Fallback về Rule-based metric và alert dev.

## 5. Container Security & Vulnerability Management

### 5.1. Trivy Security Scanning

Hệ thống sử dụng **Trivy** (Aqua Security) để scan vulnerabilities trong Docker images của tất cả backend services.

#### Automated Scanning Process
```bash
# Scan tất cả backend services
bash backend/tests/security_scan.sh

# Scan với severity levels tùy chỉnh
bash backend/tests/security_scan.sh --severity CRITICAL,HIGH,MEDIUM
```

#### Services được scan:
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
| 🔴 **CRITICAL** | Lỗ hổng cực kỳ nghiêm trọng, có thể bị exploit ngay | **Immediate fix** - Block deployment |
| 🟠 **HIGH** | Lỗ hổng nghiêm trọng | Fix trong vòng 7 ngày |
| 🟡 **MEDIUM** | Lỗ hổng trung bình | Fix trong sprint tiếp theo |
| 🟢 **LOW** | Lỗ hổng nhẹ | Track và fix khi có thời gian |

#### CI/CD Integration

**GitHub Actions Example:**
```yaml
name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Images
        run: docker-compose build
      - name: Run Trivy Scan
        run: bash backend/tests/security_scan.sh --severity CRITICAL,HIGH
      - name: Upload Reports
        uses: actions/upload-artifact@v3
        with:
          name: security-reports
          path: security-reports/
```

#### Scan Reports

Kết quả scan được lưu tại `security-reports/`:
- `[service]-scan.json`: Detailed JSON report
- `[service]-scan.txt`: Human-readable table format

### 5.2. Image Hardening Best Practices

*   **Base Images**: Sử dụng minimal base images (Alpine, Distroless)
*   **Multi-stage Builds**: Giảm attack surface bằng cách loại bỏ build tools khỏi final image
*   **Non-root User**: Chạy containers với non-root user
*   **Read-only Filesystem**: Mount root filesystem as read-only khi có thể

### 5.3. Runtime Security

*   **Redis Authentication**: Tất cả Redis connections yêu cầu password (`REDIS_AUTH`)
*   **Kafka Security**: TLS encryption cho inter-broker communication (production)
*   **Network Policies**: Restrict pod-to-pod communication trong Kubernetes

## 6. Compliance Checklist

### Security Controls Implemented
- [x] **Container Vulnerability Scanning**: Trivy automated scanning cho tất cả images
- [x] **Redis Authentication**: Password-protected Redis instances
- [x] **Secrets Management**: Environment variables cho sensitive data
- [ ] **SOC 2 Type II**: Audit logging mọi thao tác thay đổi config hệ thống
- [ ] **HIPAA**: Nếu xử lý data y tế, yêu cầu BAA với các LLM provider (Azure OpenAI)
- [ ] **GDPR**: Hỗ trợ "Right to be Forgotten" (API `DELETE /user-data/{userId}` xoá sạch dữ liệu liên quan)

### Vulnerability Management SLA
- **CRITICAL**: Patch trong vòng 24h
- **HIGH**: Patch trong vòng 7 ngày
- **MEDIUM**: Patch trong sprint tiếp theo (2 tuần)
- **LOW**: Track và fix khi có capacity

## 7. Secret Management

### Current Implementation
*   **Environment Variables**: Sử dụng `.env` files và Docker Compose environment variables
*   **Redis Password**: Configured via `REDIS_AUTH` environment variable
*   **API Keys**: Stored in environment variables, never committed to Git

### Production Recommendations
*   Không bao giờ lưu API Keys của LLM Provider trong code
*   Sử dụng **HashiCorp Vault** hoặc **AWS Secrets Manager** để inject keys vào Pods lúc runtime
*   Implement key rotation policies (90 days)
*   Use separate credentials per environment (dev/staging/prod)

## 8. Security Monitoring & Incident Response

### Monitoring
*   **Langfuse Tracing**: Track all LLM calls và evaluation requests
*   **Container Logs**: Centralized logging với retention policy
*   **Vulnerability Alerts**: Automated alerts khi Trivy phát hiện CRITICAL/HIGH vulnerabilities

### Incident Response Plan
1. **Detection**: Automated alerts từ monitoring systems
2. **Assessment**: Đánh giá severity và impact
3. **Containment**: Isolate affected services
4. **Remediation**: Apply patches, rebuild images
5. **Post-mortem**: Document lessons learned

## 9. Security Testing

### Automated Security Tests
```bash
# Container vulnerability scanning
bash backend/tests/security_scan.sh

# E2E functional tests
python backend/tests/test_e2e.py
```

### Manual Security Reviews
*   Code reviews với security checklist
*   Penetration testing (quarterly)
*   Dependency audits (monthly)

## 10. References

*   [Trivy Documentation](https://aquasecurity.github.io/trivy/)
*   [OWASP Top 10](https://owasp.org/www-project-top-ten/)
*   [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
*   [Backend Security Scan Guide](../backend/tests/SECURITY_SCAN.md)
