/**
 * Session 2 — the agent reads context and discovers the stack decision
 * that Session 1 committed. It behaves differently because of that memory.
 *
 * Run AFTER session1.ts:
 *   npx tsx session2.ts
 */

import { Contextly } from "@contextly/sdk";

async function main() {
  const ctx = new Contextly({
    token: "ctx_project.demo_ExampleTokenForDemoPurposesOnly",
    dbPath: "./example.db",
  });

  // Read context — Session 1's decision should now be visible
  const context = await ctx.read({ task: "What tech stack does this project use?" });
  console.log("Session 2 — entries found:", context.entries.length);

  if (context.entries.length === 0) {
    console.log("  No prior decisions found. The agent would need to choose a stack.");
    console.log("  (Run session1.ts first to populate the database.)");
  } else {
    for (const e of context.entries) {
      console.log(`  ${e.cid}: ${e.message}`);
      console.log(`    provenance: inherited=${e.provenance.inherited}`);
    }

    // The agent can now make a decision that *builds on* the existing stack choice
    // instead of starting from scratch — this is the behavioral difference.
    const stackEntry = context.entries.find((e) => e.cid === "tech.stack");
    if (stackEntry?.message.includes("Next.js")) {
      console.log("\n  Based on the stack decision, the agent chooses a component library:");
      const result = await ctx.commit({
        cid: "ui.framework",
        message: "Use shadcn/ui since we're on Next.js.",
        kind: "decision",
      });
      console.log(`  Committed: ${result.id} (${result.status})`);
    }
  }

  ctx.close();
}

main().catch(console.error);