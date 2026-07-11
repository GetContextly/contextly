import requests
import time
import json

BASE_URL = "http://localhost:3000" # Change if different
WEBHOOK_URL = f"{BASE_URL}/api/webhooks/github"

def test_sql_injection():
    print("🧪 [SQLi] Testing for SQL Injection vulnerabilities...")
    # Attempting common injection patterns via query params or payload
    payloads = [
        "' OR 1=1 --",
        "'; DROP TABLE projects; --",
        "1; SELECT pg_sleep(5)"
    ]

    # We test an endpoint that might interact with DB (like a search or filter if we had one)
    # Since Contextly uses Supabase Postgrest, we're testing the Next.js routes
    for p in payloads:
        # Example: if we had a project search
        resp = requests.get(f"{BASE_URL}/api/projects?search={p}")
        if resp.status_code == 500 and "sql" in resp.text.lower():
            print(f"  ❌ Potential leak/vulnerability with payload: {p}")
        else:
            print(f"  ✅ Handled payload: {p}")

def test_rate_limiting():
    print("\n🧪 [DoS] Testing Rate Limiting (Flood)...")
    success_count = 0
    start_time = time.time()

    # Send 50 requests rapidly to the webhook or a public API
    for i in range(50):
        resp = requests.post(WEBHOOK_URL, json={"ping": True})
        if resp.status_code == 200:
            success_count += 1
        elif resp.status_code == 429:
            print(f"  ✅ Rate limit triggered after {i} requests")
            return

    print(f"  ⚠️ Sent 50 requests in {time.time() - start_time:.2f}s, but no 429 received.")
    print("     (Note: Middleware rate limiting might not be active in local dev dev mode without proper setup)")

def test_security_headers():
    print("\n🧪 [Headers] Verifying Security Headers...")
    resp = requests.get(BASE_URL)
    headers = resp.headers

    required = [
        "X-Frame-Options",
        "X-Content-Type-Options",
        "Strict-Transport-Security",
        "Referrer-Policy"
    ]

    for h in required:
        if h in headers:
            print(f"  ✅ Found {h}: {headers[h]}")
        else:
            print(f"  ❌ Missing {h}")

if __name__ == "__main__":
    print("🛡️ CONTEXTLY SECURITY AUDIT TOOL")
    print("===============================")
    test_security_headers()
    test_sql_injection()
    test_rate_limiting()
