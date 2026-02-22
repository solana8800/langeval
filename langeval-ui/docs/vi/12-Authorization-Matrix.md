# 12. SYSTEM AUTHORIZATION MATRIX & SECURITY ARCHITECTURE

**Tài liệu quy định cơ chế Xác thực (Authentication) và Ủy quyền (Authorization) cho Enterprise AI Agent Evaluation Platform.**

## 1. Security Architecture Overview

Hệ thống sử dụng mô hình bảo mật hiện đại, tập trung vào **Workspace-based Access Control** (Kiểm soát truy cập dựa trên Không gian làm việc) kết hợp với **Google OAuth 2.0** để xác thực người dùng.

### 1.1. Authentication Flow (Google OAuth 2.0)
Hệ thống sử dụng **Google Account** làm phương thức xác thực chính, giúp đơn giản hóa trải nghiệm người dùng (SSO).
*   **Protocol**: OAuth 2.0 / OpenID Connect (OIDC).
*   **Identity Source**: Google Accounts.
*   **Library**: `NextAuth.js` (v5) với Google Provider.
*   **Flow**:
    1.  User nhấn "Login with Google".
    2.  Hệ thống chuyển hướng sang trang đăng nhập Google.
    3.  Sau khi xác thực thành công, Google trả về `id_token` và `access_token`.
    4.  Hệ thống tạo/cập nhật User trong DB và cấp Session Token.

### 1.2. Authorization Model (Workspace RBAC)
Sử dụng mô hình **Role-Based Access Control (RBAC)** trong phạm vi **Workspace**.
*   **Default Workspace**: Mỗi User khi đăng ký sẽ tự động được tạo 1 "Personal Workspace" mặc định.
*   **Multi-Workspace**: User có thể tạo thêm nhiều Workspace hoặc được mời vào Workspace khác.
*   **Context**: Mọi hành động (Tạo Scenario, Chạy Test) đều phải gắn liền với 1 `workspace_id` cụ thể.

---

## 2. Workspace Roles Definition

Quyền hạn được phân chia dựa trên vai trò của User trong một Workspace cụ thể:

| Role Code | Role Name | Mô tả & Quyền hạn |
| :--- | :--- | :--- |
| **OWNER** | Workspace Owner | Quyền cao nhất trong Workspace. Quản lý thành viên, Billing, xóa Workspace. Có toàn quyền với mọi Resource. |
| **EDITOR** | Editor | Quyền chỉnh sửa. Có thể tạo/sửa Scenarios, chạy Campaigns, xem báo cáo chi tiết. Không được quản lý thành viên/Billing. |
| **VIEWER** | Viewer | Quyền xem. Chỉ được xem Dashboard, kết quả test (Read-only). Không được chỉnh sửa hay chạy test. |

---

## 3. Resource Sharing & Collaboration

Hệ thống hỗ trợ cơ chế chia sẻ tài nguyên linh hoạt để phục vụ làm việc nhóm (Collaboration).

### 3.1. Team Workspace Management
*   **Create Workspace**: User có thể tạo Workspace mới -> User đó trở thành **OWNER**.
*   **Invite Member**: Owner có thể mời người khác vào Workspace thông qua Email.
    *   Người được mời sẽ nhận email noti (hoặc in-app noti).
    *   Khi chấp nhận, họ sẽ trở thành thành viên của Workspace với Role được chỉ định (Editor/Viewer).

### 3.2. Resource Sharing Levels
Mặc định, mọi Resource (Scenario, Agent, Campaign) tạo ra đều thuộc về **Workspace** (Private to Workspace).

Cơ chế Share (nếu cần chia sẻ granular tới từng User cụ thể ngoài Workspace - *Advanced Feature*):
*   **Resource Owner**: Người tạo ra Resource.
*   **Permissions**:
    *   `can_view`: Xem chi tiết.
    *   `can_edit`: Chỉnh sửa cấu hình.
    *   `can_run`: Thực thi (với Scenario/Campaign).

*(Giai đoạn 1 tập trung vào Workspace-level sharing: Thành viên trong Workspace nhìn thấy tất cả Resource của Workspace đó).*

---

## 4. Functional Permission Matrix (Workspace Scope)

| Feature / Action | OWNER | EDITOR | VIEWER |
| :--- | :---: | :---: | :---: |
| **Workspace Settings** | | | |
| Đổi tên/Avatar Workspace | ✅ | ❌ | ❌ |
| Mời thành viên (Invite) | ✅ | ❌ | ❌ |
| Xóa thành viên | ✅ | ❌ | ❌ |
| Quản lý Billing/Plan | ✅ | ❌ | ❌ |
| **Asset Management** | | | |
| Tạo Agent/Scenario mới | ✅ | ✅ | ❌ |
| Sửa/Xóa Agent/Scenario | ✅ | ✅ | ❌ |
| Xem danh sách Assets | ✅ | ✅ | ✅ |
| **Testing Operations** | | | |
| Chạy Campaign (Run Test) | ✅ | ✅ | ❌ |
| Xem kết quả Test (Report) | ✅ | ✅ | ✅ |
| Export Báo cáo (PDF) | ✅ | ✅ | ✅ |
| **Human Review** | | | |
| Chấm điểm thủ công | ✅ | ✅ | ❌ |

---

## 5. Implementation Guidelines

### 5.1. Google OAuth Configuration
1.  Tạo Project trên **Google Cloud Console**.
2.  Cấu hình **OAuth Consent Screen** (Internal/External).
3.  Tạo Credentials (OAuth Client ID) cho Web Application.
    *   Authorized JavaScript origins: `http://localhost:3000`
    *   Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
4.  Lấy `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET`.

### 5.2. Next.js Integration (Auth.js v5)
Cấu hình `.env.local`:
```bash
AUTH_GOOGLE_ID="<google-client-id>"
AUTH_GOOGLE_SECRET="<google-client-secret>"
AUTH_SECRET="<random-string>"
```

### 5.3. Backend Authorization Logic (Middleware)
Mọi API request (trừ public endpoints) phải kèm theo `workspace_id` trong Header hoặc Query Param để xác định ngữ cảnh.

```typescript
// Example: Middleware checking Workspace Permission
export async function checkWorkspacePermission(userId, workspaceId, requiredRole) {
  const member = await db.workspaceMember.findFirst({
    where: { userId, workspaceId }
  });

  if (!member) throw new Error("Not a member of this workspace");

  if (requiredRole === 'OWNER' && member.role !== 'OWNER') {
     throw new Error("Insufficient permission");
  }
  
  return true;
}
```
