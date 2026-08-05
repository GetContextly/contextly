"""
Session 1 — the agent discovers the project has no prior decisions,
chooses a stack, and commits it.

Run:  python session1.py
Then: python session2.py
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "packages", "sdk-py"))

from contextly import Contextly


def main():
    ctx = Contextly(
        token="ctx_project.demo_ExampleTokenForDemoPurposesOnly",
        db_path="./example.db",
        server_cwd=os.path.join(os.path.dirname(__file__), "..", "..", "packages", "mcp-server"),
    )

    before = ctx.read(task="What tech stack does this project use?")
    print(f"Session 1 — entries before committing: {len(before['entries'])}")
    print("  (expected: 0 — the project is fresh)\n")

    result = ctx.commit(
        cid="tech.stack",
        message="We chose Next.js for the frontend and Supabase for the backend.",
        kind="decision",
    )
    print(f"Session 1 — committed decision:")
    print(f"  id:      {result['id']}")
    print(f"  status:  {result['status']}\n")

    after = ctx.read(task="What tech stack?")
    print(f"Session 1 — entries after committing: {len(after['entries'])}")
    for e in after["entries"]:
        print(f"  {e['cid']}: {e['message']}")

    ctx.close()


if __name__ == "__main__":
    main()