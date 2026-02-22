# Hướng dẫn cấu hình Google OAuth

Để Identity Service có thể xác thực người dùng qua Google, bạn cần tạo **OAuth 2.0 Client ID** trên Google Cloud Platform.

### Bước 1: Tạo Project trên Google Cloud
1.  Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2.  Bấm vào dropdown project ở góc trên bên trái -> **New Project**.
3.  Đặt tên Project (ví dụ: `LangEval Auth`) -> Bấm **Create**.

### Bước 2: Cấu hình OAuth Consent Screen
1.  Trong menu bên trái, chọn **APIs & Services** > **OAuth consent screen**.
2.  Chọn **External** (nếu muốn cho bất kỳ ai đăng nhập) hoặc **Internal** (chỉ cho người trong tổ chức).
3.  Bấm **Create**.
4.  Điền thông tin bắt buộc:
    *   **App name**: `LangEval`
    *   **User support email**: Email của bạn.
    *   **Developer contact information**: Email của bạn.
5.  Bấm **Save and Continue** qua các bước Scopes và Test Users (có thể để mặc định).

### Bước 3: Tạo Credentials
1.  Vào menu **APIs & Services** > **Credentials**.
2.  Bấm **+ CREATE CREDENTIALS** > **OAuth client ID**.
3.  **Application type**: Chọn **Web application**.
4.  **Name**: `LangEval Web Client`.
5.  **Authorized JavaScript origins**:
    *   `http://localhost:3000` (Môi trường Dev)
    *   `https://langeval.space` (Môi trường Production - Vercel)
6.  **Authorized redirect URIs**:
    *   `http://localhost:3000/api/auth/callback/google`
    *   `https://langeval.space/api/auth/callback/google` (Production)
7.  Bấm **Create**.

### Bước 4: Cấu hình Biến môi trường (Environment Variables)

#### 4.1 Cho Identity Service (Backend)
Cập nhật vào file `.env` hoặc cấu hình Docker:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

#### 4.2 Cho Langeval UI (Frontend - Vercel)
Để NextAuth hoạt động trên Vercel, bạn **BẮT BUỘC** phải cấu hình các biến sau trong phần **Settings > Environment Variables**:

| Variable | Giá trị | Ghi chú |
| :--- | :--- | :--- |
| `NEXTAUTH_URL` | `https://langeval.space` | URL chính thức của app |
| `NEXTAUTH_SECRET` | `your-super-secret-key-here` | Dùng để mã hóa JWT (có thể tạo bằng `openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | `your-client-id...` | Lấy từ Google Console |
| `GOOGLE_CLIENT_SECRET` | `your-client-secret` | Lấy từ Google Console |
| `NEXT_PUBLIC_API_URL` | `https://api.langeval.space/api/v1` | URL của Backend API (Identity Service) |

> ⚠️ **Lưu ý**: Nếu thiếu `NEXTAUTH_SECRET`, bạn sẽ gặp lỗi **Configuration** khi chạy trên Vercel.

> ⚠️ **Bảo mật**: Không bao giờ commit `GOOGLE_CLIENT_SECRET` hoặc `NEXTAUTH_SECRET` lên Git!
