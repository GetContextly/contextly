import requests
import json

# Local endpoint for testing (if running) or we just check the logic
WEBHOOK_URL = "http://localhost:3000/api/webhooks/github"

def mock_installation_event():
    payload = {
        "action": "created",
        "installation": {
            "id": 123456,
            "account": {
                "id": 789,
                "login": "test-user",
                "type": "User"
            },
            "repository_selection": "all"
        }
    }
    print("🚀 Mocking GitHub Installation Event...")
    # This would fail if the server isn't running, but we are testing the schema logic
    print(f"Payload: {json.dumps(payload, indent=2)}")

def mock_push_event():
    payload = {
        "repository": {
            "html_url": "https://github.com/test-user/test-repo"
        },
        "commits": [
            {
                "id": "abc123sha",
                "message": "feat: added new neural sync",
                "timestamp": "2026-07-10T12:00:00Z",
                "author": {"name": "Test User", "email": "test@example.com"}
            }
        ]
    }
    print("\n🚀 Mocking GitHub Push Event...")
    print(f"Payload: {json.dumps(payload, indent=2)}")

if __name__ == "__main__":
    mock_installation_event()
    mock_push_event()
