/**
 * Session 1 — the agent discovers the project has no prior decisions,
 * chooses a stack, and commits it.
 *
 * Run:  npx tsx session1.ts
 * Then: npx tsx session2.ts
 */

import { Contextly } from "@contextly/sdk";

async function main() {
  const ctx = new Contextly({
    token: "ctx_project.demo_ExampleTokenForDemoPurposesOnly",
    dbPath: "./example.db",
  });

  // Read context — the scope is empty because nobody has written anything yet
  const before = await ctx.read({ task: "What tech stack does this project use?" });
  console.log("Session 1 — entries before committing:", before.entries.length);
  console.log("  (expected: 0 — the project is fresh)\n");

  // Commit a decision that later sessions will inherit
  const result = await ctx.commit({
    cid: "tech.stack",
    message: "We chose Next.js for the frontend and Supabase for the backend.",
    kind: "decision",
  });
  console.log("Session 1 — committed decision:");
  console.log(`  id:      ${result.id}`);
  console.log(`  status:  ${result.status}\n`);

  // Verify it's readable
  const after = await ctx.read({ task: "What tech stack?" });
  console.log("Session 1 — entries after committing:", after.entries.length);
  for (const e of after.entries) {
    console.log(`  ${e.cid}: ${e.message}`);
  }

  ctx.close();
}

main().catch(console.error);