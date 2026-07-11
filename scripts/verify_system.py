import os
import requests
import sys

# Supabase Credentials from .env
SUPABASE_URL = "https://eguexbktmlytuplvwxma.supabase.co"
# Using the Service Role Key for full system verification
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVndWV4Ymt0bWx5dHVwbHZ3eG1hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzU4MDcyMCwiZXhwIjoyMDk5MTU2NzIwfQ.D8ACStbL8_ICSlSFio46DXb5CT588FS3i4k61Puuvto"

def verify_tables():
    print("🔍 Verifying Supabase Tables...")
    tables = [
        "projects", "decisions", "changes", "project_members",
        "audit_logs", "embeddings", "usage_quotas", "profiles", "subscriptions"
    ]

    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}"
    }

    success_count = 0
    for table in tables:
        # Check if table is reachable via REST API
        resp = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?select=count", headers=headers)
        if resp.status_code == 200:
            print(f"  ✅ Table '{table}': ONLINE")
            success_count += 1
        else:
            print(f"  ❌ Table '{table}': OFFLINE (Status {resp.status_code})")
            print(f"     Detail: {resp.text}")

    return success_count == len(tables)

def verify_rpc():
    print("\n🔍 Verifying Database Functions (RPC)...")
    functions = ["match_embeddings", "check_sync_usage"]

    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}"
    }

    # Verify rpc endpoints exist in the OpenAPI spec
    resp = requests.get(f"{SUPABASE_URL}/rest/v1/", headers=headers)
    if resp.status_code == 200:
        spec = resp.text
        for func in functions:
            if f"/rpc/{func}" in spec:
                print(f"  ✅ Function '{func}': REGISTERED")
            else:
                print(f"  ❌ Function '{func}': NOT FOUND")
    else:
        print(f"  ❌ Could not fetch API spec")

if __name__ == "__main__":
    try:
        if verify_tables():
            print("\n✨ DATABASE STRUCTURE VERIFIED")
        verify_rpc()
    except Exception as e:
        print(f"FATAL: Verification script failed: {e}")
        sys.exit(1)
