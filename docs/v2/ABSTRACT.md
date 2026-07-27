# Contextly: The Constraint DAG

## A Design Paper for the Infrastructure of AI Context

**Version 1.0 — July 2026**

---

## Abstract

This document describes a new category of infrastructure: the **Constraint DAG**. Unlike existing systems that store context as retrievable documents or vector embeddings, Contextly models context as a directed acyclic graph of *Claims* — atomic, scoped, timestamped assertions about the state of a system. Each Claim either constrains future decisions or records a constraint that was already applied. The system acts not as a database that agents query, but as a **compiler** that agents inherit — actively enforcing the constraint space at session start and continuously validating every proposal against the established graph. This paper defines the atomic primitive (the Claim), the eleven immutable laws of context propagation, the fork/commit/merge interface for agent collaboration, and the 10-year scalability path from single-user workspaces to a global constraint fabric serving billions of autonomous agents.

---

## 1. The Thesis

### The Category We Are Creating

Contextly is a **constraint infrastructure layer** for AI — not a memory system, not a vector database, not a document store. It sits between AI agents and the systems they act upon, enforcing the accumulated decisions, observations, and rules that define how a project works.

This is a new category because:

- **Memory systems** (Mem0, Zep, OpenAI Memory) store what happened. They are retrospective. They answer "what was said?"
- **Vector databases** (Pinecone, Weaviate) store representations of content. They are similarity engines. They answer "what is similar?"
- **Document stores** (Notion, Confluence) store human-authored knowledge. They are static. They answer "what was written?"

Contextly does none of these. It answers: **"what constraints apply to this next decision?"**

This is inherently prospective. It is about narrowing the space of valid future actions, not enlarging the pool of retrievable past information.

### The Problem We Are Solving

AI agents today operate in a vacuum. Every session begins with zero knowledge of prior decisions, architectural constraints, or organizational policies. This is not a storage problem — it is a **continuity of constraint propagation** problem.

An agent working on authentication has no way of knowing that the team standardized on Supabase RLS three months ago, unless that information is explicitly injected into the context window. And even when it is, the agent has no way of committing its own decisions back into a shared constraint space that the next agent will inherit.

The result is a cycle of:
- Repeated mistakes
- Silent contradictions between agents
- Lost rationale for architectural choices
- Context window exhaustion from redundant background information

Current "solutions" — system prompts, knowledge bases, RAG pipelines — are patches on a missing substrate. They treat the symptom (agents lack information) rather than the cause (agents lack a constraint propagation layer).

### Why Existing AI Memory Systems Fail

Every existing AI memory system makes the same mistake: they model context as **content** — documents, vectors, conversation logs — and treat retrieval as **search**. This fails because:

1. **Content is infinite; constraints are finite.** A project generates unlimited content (commits, conversations, PR comments). But the number of active constraints on the decision space is bounded and small. The constraint set for a mature project fits in a few hundred structured records. The content history fills gigabytes. Storing content when the value is in constraints is an optimization error.

2. **Search is probabilistic; constraint inheritance is deterministic.** A vector search for "authentication decisions" may or may not return the relevant row. A constraint query ("what active Claims apply to scope=auth?") returns exactly the five constraints that govern authentication. One is unreliable; the other is an invariant.

3. **Memory is retrospective; constraints are prospective.** Storing past conversations helps an agent understand what was discussed. It does not help an agent understand what it is *allowed* to do. The difference is between a transcript and a constitution.

4. **Similarity is not relevance.** A vector search returns what is textually similar, not what is contextually relevant. A decision about "Supabase" is relevant to authentication even if the text says "we chose Supabase for real-time subscriptions" — a vector search for "authentication" with low similarity threshold would miss it. A constraint query over the entity graph finds it because "Supabase" is linked to "authentication" via a prior Claim.

5. **Memory systems optimize for recall; context systems optimize for correctness.** The goal of a memory system is to retrieve as much relevant information as possible. The goal of Contextly is to return exactly the set of active constraints — no more, no less. Extra context is noise. Missing context is a bug.

### Why This Deserves to Exist

AI agents are becoming the primary interface through which software is built, operated, and maintained. Each agent, each session, each tool is currently isolated. There is no shared substrate that decisions propagate through.

This substrate will be built. The question is whether it is built as an afterthought inside every agent platform (fragmented, inconsistent, proprietary) or as an open infrastructure layer that every agent speaks (unified, composable, persistent).

Contextly exists to be that substrate. It is the Git of the AI age — not a tool, but a protocol and a storage layer that decisions flow through.