import requests
import sys

def test_endpoints():
    base_url = "http://localhost:8000"
    endpoints = [
        "/api/startups",
        "/api/admin/startups/pending",
        "/api/ground-agents/applications"
    ]
    
    print(f"Testing backend at {base_url}...")
    for ep in endpoints:
        try:
            # Note: some endpoints require auth, but we just check if they respond (even with 401/403)
            # instead of 500 or ConnectionError
            resp = requests.get(f"{base_url}{ep}", timeout=5)
            print(f"GET {ep} -> Status: {resp.status_code}")
        except Exception as e:
            print(f"GET {ep} -> FAILED: {str(e)}")

if __name__ == "__main__":
    test_endpoints()
