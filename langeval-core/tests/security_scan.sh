#!/bin/bash

# ============================================================================
# Script: Security Scan với Trivy
# Mô tả: Scan các Docker images của backend services để phát hiện lỗ hổng bảo mật
# Sử dụng: bash backend/tests/security_scan.sh [--severity LEVEL] [--format FORMAT]
# ============================================================================

set -e

# Màu sắc cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Cấu hình mặc định
SEVERITY="${SEVERITY:-CRITICAL,HIGH}"
FORMAT="${FORMAT:-table}"
OUTPUT_DIR="./security-reports"
FAIL_ON_CRITICAL="${FAIL_ON_CRITICAL:-true}"

# Danh sách images cần scan
IMAGES=(
    "backend-orchestrator"
    "backend-simulation-worker"
    "backend-evaluation-worker"
    "backend-identity-service"
    "backend-resource-service"
    "backend-gen-ai-service"
    "backend-data-ingestion"
)

# ============================================================================
# Functions
# ============================================================================

print_header() {
    echo -e "${BLUE}============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_trivy_available() {
    # Sử dụng Docker để chạy Trivy - không cần cài đặt local
    if ! docker info &> /dev/null; then
        print_error "Docker không chạy hoặc không thể kết nối!"
        echo ""
        echo "Script này sử dụng Trivy qua Docker container."
        echo "Vui lòng khởi động Docker và thử lại."
        exit 1
    fi
    
    # Pull Trivy image nếu chưa có
    echo "Kiểm tra Trivy Docker image..."
    if ! docker image inspect aquasec/trivy:latest &> /dev/null; then
        echo "Đang tải Trivy Docker image (lần đầu tiên)..."
        docker pull aquasec/trivy:latest
    fi
    
    print_success "Trivy Docker image sẵn sàng"
}

check_docker_running() {
    if ! docker info &> /dev/null; then
        print_error "Docker không chạy hoặc không thể kết nối!"
        exit 1
    fi
    print_success "Docker đang chạy"
}

scan_image() {
    local image_name=$1
    local image_tag="${image_name}:latest"
    
    echo ""
    print_header "Scanning: ${image_name}"
    
    # Kiểm tra image có tồn tại không
    if ! docker image inspect "${image_tag}" &> /dev/null; then
        print_warning "Image ${image_tag} không tồn tại. Bỏ qua..."
        return 0
    fi
    
    # Tạo output directory nếu chưa có
    mkdir -p "${OUTPUT_DIR}"
    
    local json_output="${OUTPUT_DIR}/${image_name}-scan.json"
    local table_output="${OUTPUT_DIR}/${image_name}-scan.txt"
    
    # Scan với JSON format (để parse sau này)
    echo "Đang scan ${image_tag} với Trivy (Docker)..."
    docker run --rm \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v "$(pwd)/${OUTPUT_DIR}:/output" \
        aquasec/trivy:latest image \
        --severity "${SEVERITY}" \
        --format json \
        --output "/output/${image_name}-scan.json" \
        "${image_tag}"
    
    # Scan với Table format (để hiển thị)
    docker run --rm \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v "$(pwd)/${OUTPUT_DIR}:/output" \
        aquasec/trivy:latest image \
        --severity "${SEVERITY}" \
        --format table \
        --output "/output/${image_name}-scan.txt" \
        "${image_tag}"
    
    # Hiển thị kết quả
    cat "${table_output}"
    
    # Đếm số lượng vulnerabilities
    if command -v jq &> /dev/null; then
        local critical_count=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity=="CRITICAL")] | length' "${json_output}" 2>/dev/null || echo "0")
        local high_count=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity=="HIGH")] | length' "${json_output}" 2>/dev/null || echo "0")
        local medium_count=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity=="MEDIUM")] | length' "${json_output}" 2>/dev/null || echo "0")
        local low_count=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity=="LOW")] | length' "${json_output}" 2>/dev/null || echo "0")
        
        echo ""
        echo "📊 Tổng kết cho ${image_name}:"
        echo "   🔴 CRITICAL: ${critical_count}"
        echo "   🟠 HIGH:     ${high_count}"
        echo "   🟡 MEDIUM:   ${medium_count}"
        echo "   🟢 LOW:      ${low_count}"
        
        # Lưu kết quả để kiểm tra sau
        TOTAL_CRITICAL=$((TOTAL_CRITICAL + critical_count))
        TOTAL_HIGH=$((TOTAL_HIGH + high_count))
    else
        print_warning "jq không có sẵn - bỏ qua thống kê chi tiết"
    fi
    
    print_success "Kết quả đã lưu vào: ${json_output}"
}

# ============================================================================
# Main Script
# ============================================================================

print_header "🔒 Backend Security Scan với Trivy"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --severity)
            SEVERITY="$2"
            shift 2
            ;;
        --format)
            FORMAT="$2"
            shift 2
            ;;
        --no-fail)
            FAIL_ON_CRITICAL="false"
            shift
            ;;
        --help)
            echo "Sử dụng: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --severity LEVEL    Mức độ nghiêm trọng (mặc định: CRITICAL,HIGH)"
            echo "                      Các giá trị: CRITICAL, HIGH, MEDIUM, LOW"
            echo "  --format FORMAT     Định dạng output (mặc định: table)"
            echo "                      Các giá trị: table, json, sarif"
            echo "  --no-fail           Không fail script khi phát hiện vulnerabilities"
            echo "  --help              Hiển thị hướng dẫn này"
            echo ""
            echo "Ví dụ:"
            echo "  $0                                    # Scan với cấu hình mặc định"
            echo "  $0 --severity CRITICAL,HIGH,MEDIUM    # Scan với nhiều mức độ"
            echo "  $0 --no-fail                          # Scan nhưng không fail"
            exit 0
            ;;
        *)
            print_error "Tham số không hợp lệ: $1"
            echo "Sử dụng --help để xem hướng dẫn"
            exit 1
            ;;
    esac
done

echo "Cấu hình:"
echo "  - Severity: ${SEVERITY}"
echo "  - Format: ${FORMAT}"
echo "  - Output Directory: ${OUTPUT_DIR}"
echo "  - Fail on Critical: ${FAIL_ON_CRITICAL}"
echo ""

# Kiểm tra dependencies
check_trivy_available
check_docker_running

# Kiểm tra jq (để parse JSON) - optional
if ! command -v jq &> /dev/null; then
    print_warning "jq chưa được cài đặt. Thống kê chi tiết sẽ bị bỏ qua."
    print_warning "Cài đặt jq để có thống kê đầy đủ:"
    print_warning "  macOS: brew install jq"
    print_warning "  Linux: sudo apt-get install jq"
    echo ""
fi

# Khởi tạo counters
TOTAL_CRITICAL=0
TOTAL_HIGH=0

# Scan từng image
for image in "${IMAGES[@]}"; do
    scan_image "${image}"
done

# Tổng kết cuối cùng
echo ""
print_header "📊 Tổng Kết Toàn Bộ Backend"
echo "🔴 Tổng CRITICAL vulnerabilities: ${TOTAL_CRITICAL}"
echo "🟠 Tổng HIGH vulnerabilities:     ${TOTAL_HIGH}"
echo ""
echo "📁 Báo cáo chi tiết đã được lưu tại: ${OUTPUT_DIR}/"
echo ""

# Kiểm tra và fail nếu cần
if [ "${FAIL_ON_CRITICAL}" = "true" ]; then
    if [ ${TOTAL_CRITICAL} -gt 0 ]; then
        print_error "Phát hiện ${TOTAL_CRITICAL} CRITICAL vulnerabilities!"
        print_error "Security scan FAILED ❌"
        exit 1
    elif [ ${TOTAL_HIGH} -gt 0 ]; then
        print_warning "Phát hiện ${TOTAL_HIGH} HIGH vulnerabilities."
        print_warning "Nên xem xét và fix các lỗ hổng này."
    fi
fi

print_success "Security scan hoàn tất! ✅"
exit 0
