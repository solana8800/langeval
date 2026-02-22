import asyncio
import httpx

async def test_langfuse():
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Test health endpoint
            health_url = "http://localhost:3000/api/public/health"
            print(f"Testing: {health_url}")
            health_resp = await client.get(health_url)
            print(f"Health: {health_resp.status_code} - {health_resp.text}")
            
            # Test traces endpoint with auth
            traces_url = "http://localhost:3000/api/public/traces"
            public_key = "pk-lf-15606cc7-005e-4d18-8ad7-acd706de52fe"
            secret_key = "sk-lf-ef174c3a-07ae-4c45-8222-5593f930ea9c"
            project_id = "cml8wik9h0006qg07k21fa2sa"
            
            print(f"\nTesting: {traces_url}")
            traces_resp = await client.get(
                traces_url,
                params={"limit": 5, "page": 1},
                auth=(public_key, secret_key),
                headers={"X-Langfuse-Project-Id": project_id}
            )
            print(f"Traces: {traces_resp.status_code}")
            print(f"Response: {traces_resp.text[:500]}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_langfuse())
