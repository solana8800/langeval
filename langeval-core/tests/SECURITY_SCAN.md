# Security Scanning với Trivy

## Yêu cầu

Script này sử dụng **Trivy qua Docker container**, do đó bạn **KHÔNG CẦN** cài đặt Trivy local.

### Yêu cầu duy nhất
- ✅ **Docker**: Đảm bảo Docker đang chạy
- ⚙️ **jq** (Optional): Để có thống kê chi tiết hơn
  - macOS: `brew install jq`
  - Linux: `sudo apt-get install jq`

Script sẽ tự động pull Trivy Docker image (`aquasec/trivy:latest`) lần đầu tiên chạy.

## Sử dụng

### Scan cơ bản (CRITICAL + HIGH)
```bash
bash backend/tests/security_scan.sh
```

### Scan với nhiều mức độ nghiêm trọng
```bash
bash backend/tests/security_scan.sh --severity CRITICAL,HIGH,MEDIUM
```

### Scan tất cả mức độ
```bash
bash backend/tests/security_scan.sh --severity CRITICAL,HIGH,MEDIUM,LOW
```

### Scan nhưng không fail khi có lỗi
```bash
bash backend/tests/security_scan.sh --no-fail
```

### Xem hướng dẫn đầy đủ
```bash
bash backend/tests/security_scan.sh --help
```

## Output

Script sẽ tạo thư mục `security-reports/` chứa:
- `[service-name]-scan.json`: Kết quả chi tiết dạng JSON
- `[service-name]-scan.txt`: Kết quả dạng bảng (table)

## Services được scan

1. `backend-orchestrator`
2. `backend-simulation-worker`
3. `backend-evaluation-worker`
4. `backend-identity-service`
5. `backend-resource-service`
6. `backend-gen-ai-service`
7. `backend-data-ingestion`

## Mức độ nghiêm trọng (Severity Levels)

- 🔴 **CRITICAL**: Lỗ hổng cực kỳ nghiêm trọng, cần fix ngay lập tức
- 🟠 **HIGH**: Lỗ hổng nghiêm trọng, ưu tiên cao
- 🟡 **MEDIUM**: Lỗ hổng trung bình
- 🟢 **LOW**: Lỗ hổng nhẹ

## Exit Codes

- `0`: Scan thành công, không có CRITICAL vulnerabilities
- `1`: Scan thất bại hoặc phát hiện CRITICAL vulnerabilities

## Ví dụ Output

```
============================================================================
🔒 Backend Security Scan với Trivy
============================================================================
Cấu hình:
  - Severity: CRITICAL,HIGH
  - Format: table
  - Output Directory: ./security-reports
  - Fail on Critical: true

✅ Trivy đã được cài đặt (Version: 0.48.0)
✅ Docker đang chạy

============================================================================
Scanning: backend-orchestrator
============================================================================
Đang scan backend-orchestrator:latest...

📊 Tổng kết cho backend-orchestrator:
   🔴 CRITICAL: 2
   🟠 HIGH:     5
   🟡 MEDIUM:   10
   🟢 LOW:      3

✅ Kết quả đã lưu vào: ./security-reports/backend-orchestrator-scan.json

============================================================================
📊 Tổng Kết Toàn Bộ Backend
============================================================================
🔴 Tổng CRITICAL vulnerabilities: 8
🟠 Tổng HIGH vulnerabilities:     25

📁 Báo cáo chi tiết đã được lưu tại: security-reports/

✅ Security scan hoàn tất! ✅
```

## Tích hợp vào CI/CD

### GitHub Actions
```yaml
- name: Security Scan
  run: |
    bash backend/tests/security_scan.sh --severity CRITICAL,HIGH
```

### GitLab CI
```yaml
security_scan:
  script:
    - bash backend/tests/security_scan.sh --severity CRITICAL,HIGH
  artifacts:
    paths:
      - security-reports/
```

## Lưu ý

- Script yêu cầu `jq` để parse JSON và hiển thị thống kê chi tiết
- Cài đặt `jq`: 
  - macOS: `brew install jq`
  - Linux: `sudo apt-get install jq`
- Nếu không có `jq`, script vẫn chạy nhưng không có thống kê chi tiết
