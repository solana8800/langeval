import os
import httpx
from typing import Optional, Dict
from jose import jwt, jwk
from jose.utils import base64url_decode
from pydantic import BaseModel

# Configuration (Defaults to Mock for Dev if vars missing)
ENTRA_TENANT_ID = os.getenv("ENTRA_TENANT_ID", "mock-tenant")
ENTRA_CLIENT_ID = os.getenv("ENTRA_CLIENT_ID", "mock-client")
# Discovery Endpoint: https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration
# For now, let's assume we can mock it if env is not set.

class UserContext(BaseModel):
    oid: str # Entra Object ID (Subject)
    email: str
    name: Optional[str] = None

# Cache for JWKs
_jwks_cache: Dict = {}

async def get_jwks(issuer: str) -> Dict:
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache
    
    # Discovery (Simplified)
    jwks_url = f"https://login.microsoftonline.com/{ENTRA_TENANT_ID}/discovery/v2.0/keys"
    
    # Mock Mode
    if ENTRA_TENANT_ID == "mock-tenant":
        return {} # Mock cannot fetch real keys

    async with httpx.AsyncClient() as client:
        resp = await client.get(jwks_url)
        resp.raise_for_status()
        _jwks_cache = resp.json()
        return _jwks_cache

async def verify_token(token: str) -> UserContext:
    if ENTRA_TENANT_ID == "mock-tenant":
        # BYPASS AUTH FOR DEV (If configured)
        # Decode without verification just to extract claims
        # Or just return a mock user
        return UserContext(
            oid="mock-user-oid-123",
            email="dev@example.com",
            name="Developer"
        )

    # Real Verification Logic
    # 1. Get Header (kid)
    # 2. Find Key in JWK
    # 3. Verify Signature
    # 4. Verify Audience/Issuer
    
    # Simplified Implementation (Placeholder for full JWK logic)
    # In real world, use a library like fast-api-jwt or similar wrapper.
    # Here we just show the contract.
    
    return UserContext(oid="real-user", email="real@example.com")
