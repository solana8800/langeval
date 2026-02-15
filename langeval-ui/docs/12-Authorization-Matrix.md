# 12. SYSTEM AUTHORIZATION MATRIX & SECURITY ARCHITECTURE

**Tài liệu quy định cơ chế Xác thực (Authentication) và Ủy quyền (Authorization) cho Enterprise AI Agent Evaluation Platform.**

## 1. Security Architecture Overview

Hệ thống sử dụng mô hình bảo mật hiện đại, tách biệt Identity Provider (IdP) khỏi ứng dụng để đảm bảo tính bảo mật và khả năng mở rộng cho doanh nghiệp.

### 1.1. Authentication Flow (Entra External ID)
Hệ thống sử dụng **Microsoft Azure Active Directory B2C (Entra External ID)** làm Identity Provider chính.
*   **Protocol**: OpenID Connect (OIDC) / OAuth 2.0.
*   **Identity Source**:
    *   **Enterprise Users**: Tích hợp Azure AD của tổ chức (SSO).
    *   **External Partners**: Email/Password hoặc Social Login (nếu cần).
*   **Library**: `NextAuth.js` (v5) được cấu hình với Entra External ID Provider.

### 1.2. Authorization Model (RBAC)
Sử dụng mô hình **Role-Based Access Control (RBAC)**.
*   Permissions được gán cho Role.
*   User được gán một hoặc nhiều Role.
*   Việc kiểm tra quyền được thực hiện ở cả 2 lớp:
    *   **Frontend**: Ẩn/hiện UI components (Menu, Button).
    *   **Backend/API**: Middleware chặn request không hợp lệ (Critical).

---

## 2. User Roles Definition

Hệ thống định nghĩa 5 nhóm người dùng chính phù hợp với quy trình vận hành MLOps/LLMOps:

| Role Code | Role Name | Mô tả & Trách nhiệm |
| :--- | :--- | :--- |
| **SYS_ADMIN** | System Admin | Quản trị viên hệ thống. Có quyền cấu hình global, quản lý user, xem audit logs. |
| **WS_OWNER** | Workspace Owner | Chủ sở hữu Workspace/Dự án. Quản lý billing, settings dự án, mời thành viên. |
| **AI_ENG** | AI Engineer | Kỹ sư AI. Chịu trách nhiệm kết nối Agent, debug lỗi, tối ưu Prompt, xem logs chi tiết. |
| **QA_LEAD** | QA/Tester | Chuyên viên kiểm thử. Thiết lập kịch bản test (Scenarios), chạy đánh giá, duyệt kết quả Human Review. |
| **STAKEHOLDER** | Viewer | Các bên liên quan (PM, Client). Chỉ được xem Dashboard, Báo cáo tổng hợp, không được sửa đổi. |

---

## 3. Functional Permission Matrix (Ma Trận Phân Quyền)

Dưới đây là ma trận chi tiết quyền hạn truy cập theo từng module chức năng:

**Ký hiệu:**
*   ✅: Full Access (Create, Read, Update, Delete)
*   👁️: View Only (Read)
*   ❌: No Access

### 3.1. Core Modules

| Feature / Action | SYS_ADMIN | WS_OWNER | AI_ENG | QA_LEAD | STAKEHOLDER |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Agent Management** | | | | | |
| Tạo/Kết nối Agent mới | ✅ | ✅ | ✅ | ❌ | ❌ |
| Xem cấu hình Webhook/API | ✅ | ✅ | ✅ | ❌ | ❌ |
| Xóa Agent | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Test Scenarios** | | | | | |
| Tạo mới Scenario/Dataset | ✅ | ✅ | ✅ | ✅ | ❌ |
| Chỉnh sửa Scenario | ✅ | ✅ | ✅ | ✅ | ❌ |
| Chạy Test (Manual Trigger) | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Red-Teaming** | | | | | |
| Cấu hình Attack Strategy | ✅ | ✅ | ✅ | ❌ | ❌ |
| Kích hoạt Red-Teaming | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Human Review** | | | | | |
| Truy cập hàng chờ Review | ✅ | ✅ | 👁️ | ✅ | ❌ |
| Chấm điểm/Dán nhãn (Label) | ✅ | ✅ | ❌ | ✅ | ❌ |

### 3.2. Analytics & Reporting

| Feature / Action | SYS_ADMIN | WS_OWNER | AI_ENG | QA_LEAD | STAKEHOLDER |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Dashboard Overview** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Deep Dive Logs** (Traces) | ✅ | ✅ | ✅ | 👁️ | ❌ |
| **Export Report** (PDF/CSV) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **System Health Metrics** | ✅ | ✅ | ✅ | ❌ | ❌ |

### 3.3. Administration

| Feature / Action | SYS_ADMIN | WS_OWNER | AI_ENG | QA_LEAD | STAKEHOLDER |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **User Management** (Invite/Remove)| ✅ | ✅ | ❌ | ❌ | ❌ |
| **Billing & Plan** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **System Audit Logs** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **API Key Management** | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 4. Implementation Guidelines

### 4.1. Entra External ID Configuration
1.  Tạo **Entra External ID Tenant**.
2.  Đăng ký ứng dụng (App Registration) cho Web App.
3.  Tạo **User Flows** (Sign up, Sign in, Password reset).
4.  Lấy `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID`.

### 4.2. Next.js Integration
Cấu hình biến môi trường trong `.env.local` (Sử dụng Auth.js / NextAuth v5 với Provider Entra ID):

```bash
# Entra External ID (Formerly Azure AD B2C) Configuration
AUTH_MICROSOFT_ENTRA_ID_ID="<client-id>"
AUTH_MICROSOFT_ENTRA_ID_SECRET="<client-secret>"
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID="<tenant-id>"

# NextAuth Configuration
AUTH_SECRET="<random-string-openssl-rand-base64-32>"
AUTH_URL="http://localhost:3000" # Or production URL
```

### 4.3. RBAC Middleware Logic
Ví dụ Logic kiểm tra quyền trong API Route:

```typescript
// app/api/agents/create/route.ts
import { auth } from "@/auth"

export async function POST(req) {
  const session = await auth();
  
  // 1. Check Authentication
  if (!session) return new Response("Unauthorized", { status: 401 });

  // 2. Check Authorization (RBAC)
  const userRole = session.user.role; // Lấy từ Token Claims
  if (!['SYS_ADMIN', 'WS_OWNER', 'AI_ENG'].includes(userRole)) {
     return new Response("Forbidden: Insufficient Permissions", { status: 403 });
  }

  // 3. Proceed
  // ... create agent logic
}
```
