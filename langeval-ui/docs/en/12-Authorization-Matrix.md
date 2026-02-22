# 12. SYSTEM AUTHORIZATION MATRIX & SECURITY ARCHITECTURE

**This document defines the Authentication and Authorization mechanisms for the Enterprise AI Agent Evaluation Platform.**

---

## 1. Security Architecture Overview

The system employs a modern security model focusing on **Workspace-based Access Control** combined with **Google OAuth 2.0** for user authentication.

### 1.1. Authentication Flow (Google OAuth 2.0)
The system uses **Google Accounts** as the primary authentication method to simplify the user experience (SSO).
*   **Protocol**: OAuth 2.0 / OpenID Connect (OIDC).
*   **Identity Source**: Google Accounts.
*   **Library**: `NextAuth.js` (v5) with Google Provider.
*   **Flow**:
    1.  User clicks "Login with Google."
    2.  System redirects to the Google login page.
    3.  Upon successful authentication, Google returns an `id_token` and `access_token`.
    4.  The system creates/updates the User in the DB and issues a Session Token.

### 1.2. Authorization Model (Workspace RBAC)
Uses **Role-Based Access Control (RBAC)** within the scope of a **Workspace**.
*   **Default Workspace**: Every user is automatically assigned a "Personal Workspace" upon registration.
*   **Multi-Workspace**: Users can create additional workspaces or be invited to others.
*   **Context**: Every action (creating scenarios, running tests) must be associated with a specific `workspace_id`.

---

## 2. Workspace Roles Definition

Permissions are divided based on the user's role within a specific Workspace:

| Role Code | Role Name | Description & Permissions |
| :--- | :--- | :--- |
| **OWNER** | Workspace Owner | Highest authority. Manages members, billing, and workspace deletion. Full control over all resources. |
| **EDITOR** | Editor | Editing rights. Can create/edit scenarios, run campaigns, and view detailed reports. Cannot manage members or billing. |
| **VIEWER** | Viewer | View-only rights. Can access dashboards and test results (Read-only). Cannot edit or run tests. |

---

## 3. Resource Sharing & Collaboration

### 3.1. Team Workspace Management
*   **Create Workspace**: A user can create a new workspace and becomes its **OWNER**.
*   **Invite Member**: Owners can invite others via email.
    *   Invitees receive notifications and, upon acceptance, become members with an assigned role (Editor/Viewer).

### 3.2. Resource Sharing Levels
By default, all resources (Scenarios, Agents, Campaigns) belong to the **Workspace** (Private to Workspace).

---

## 4. Functional Permission Matrix (Workspace Scope)

| Feature / Action | OWNER | EDITOR | VIEWER |
| :--- | :---: | :---: | :---: |
| **Workspace Settings** | | | |
| Rename/Change Avatar | ✅ | ❌ | ❌ |
| Invite Members | ✅ | ❌ | ❌ |
| Remove Members | ✅ | ❌ | ❌ |
| Manage Billing/Plan | ✅ | ❌ | ❌ |
| **Asset Management** | | | |
| Create new Agent/Scenario | ✅ | ✅ | ❌ |
| Edit/Delete Agent/Scenario | ✅ | ✅ | ❌ |
| View Asset List | ✅ | ✅ | ✅ |
| **Testing Operations** | | | |
| Run Campaign (Test Run) | ✅ | ✅ | ❌ |
| View Test Results (Report) | ✅ | ✅ | ✅ |
| Export Reports (PDF) | ✅ | ✅ | ✅ |
| **Human Review** | | | |
| Manual Scoring | ✅ | ✅ | ❌ |

---

## 5. Implementation Guidelines

### 5.1. Google OAuth Configuration
1.  Create a project on the **Google Cloud Console**.
2.  Configure the **OAuth Consent Screen**.
3.  Create Credentials (OAuth Client ID) for the web application.
    *   Redirect URI: `http://localhost:3000/api/auth/callback/google`
    *   Obtain `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### 5.2. Next.js Integration (Auth.js v5)
Configure `.env.local`:
```bash
AUTH_GOOGLE_ID="<google-client-id>"
AUTH_GOOGLE_SECRET="<google-client-secret>"
AUTH_SECRET="<random-string>"
```

### 5.3. Backend Authorization Logic (Middleware)
Every API request must include a `workspace_id` to define the context.

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
