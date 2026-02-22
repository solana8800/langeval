# Google OAuth Setup Guide

To enable user authentication via Google in the Identity Service, you need to create **OAuth 2.0 Client IDs** on the Google Cloud Platform.

### Step 1: Create a Project on Google Cloud
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Click the project dropdown in the top-left -> **New Project**.
3.  Enter a Project Name (e.g., `LangEval Auth`) -> Click **Create**.

### Step 2: Configure OAuth Consent Screen
1.  In the left menu, select **APIs & Services** > **OAuth consent screen**.
2.  Choose **External** (to allow anyone to log in) or **Internal** (if restricted to your organization).
3.  Click **Create**.
4.  Fill in the required information:
    *   **App name**: `LangEval`
    *   **User support email**: Your email address.
    *   **Developer contact information**: Your email address.
5.  Click **Save and Continue** through the Scopes and Test Users steps (defaults are usually fine).

### Step 3: Create Credentials
1.  Go to the **APIs & Services** > **Credentials** menu.
2.  Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
3.  **Application type**: Select **Web application**.
4.  **Name**: `LangEval Web Client`.
5.  **Authorized JavaScript origins**:
    *   `http://localhost:3000` (Development)
    *   `https://langeval.space` (Production - Vercel)
6.  **Authorized redirect URIs**:
    *   `http://localhost:3000/api/auth/callback/google`
    *   `https://langeval.space/api/auth/callback/google` (Production)
7.  Click **Create**.

### Step 4: Configure Environment Variables

#### 4.1 For Identity Service (Backend)
Update your `.env` file or Docker configuration:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

#### 4.2 For Langeval UI (Frontend - Vercel)
To make NextAuth work on Vercel, you **MUST** configure the following environment variables in **Settings > Environment Variables**:

| Variable | Value | Notes |
| :--- | :--- | :--- |
| `NEXTAUTH_URL` | `https://langeval.space` | Official app URL |
| `NEXTAUTH_SECRET` | `your-super-secret-key-here` | Used for JWT encryption (generate with `openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | `your-client-id...` | From Google Console |
| `GOOGLE_CLIENT_SECRET` | `your-client-secret` | From Google Console |
| `NEXT_PUBLIC_API_URL` | `https://api.langeval.space/api/v1` | Backend API URL |

> ⚠️ **Note**: If `NEXTAUTH_SECRET` is missing, you will encounter a **Configuration** error on Vercel.

> ⚠️ **Security**: Never commit `GOOGLE_CLIENT_SECRET` or `NEXTAUTH_SECRET` to Git!
