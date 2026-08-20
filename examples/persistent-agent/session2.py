"""
Session 2 — the agent reads context and discovers the stack decision
that Session 1 committed. It behaves differently because of that memory.

Run AFTER session1.py:
  python session2.py
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

    context = ctx.read(task="What tech stack does this project use?")
    print(f"Session 2 — entries found: {len(context['entries'])}")

    if len(context["entries"]) == 0:
        print("  No prior decisions found. Run session1.py first.")
    else:
        for e in context["entries"]:
            print(f"  {e['cid']}: {e['message']}")
            print(f"    provenance: inherited={e['provenance']['inherited']}")

        stack_entries = [e for e in context["entries"] if e["cid"] == "tech.stack"]
        if stack_entries and "Next.js" in stack_entries[0]["message"]:
            print("\n  Based on the stack decision, the agent chooses a component library:")
            result = ctx.commit(
                cid="ui.framework",
                message="Use shadcn/ui since we're on Next.js.",
                kind="decision",
            )
            print(f"  Committed: {result['id']} ({result['status']})")

    ctx.close()


if __name__ == "__main__":
    main()