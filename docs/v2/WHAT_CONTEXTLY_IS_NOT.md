# What Contextly Is NOT

### A Memory Database

A memory database stores conversation history, user preferences, and session state. It is scoped to a single user or a single conversation. It does not model constraints. It does not enforce them. It does not compose across users or sessions.

Contextly does none of this. It does not store conversation history. It does not model user preferences. It is not scoped to a single conversation. What it does — propagate constraints across sessions, tools, and users — a memory database cannot do.

### A Vector Database

A vector database stores embeddings and retrieves by similarity. It is a search engine for representations. It does not understand scope, does not track provenance, does not enforce constraints, does not model certainty.

Contextly is not a better vector database. It is a different category. The vector index is a derived optimization for fuzzy retrieval, not the primary storage model. The primary model is the DAG.

### A RAG System

RAG (Retrieval-Augmented Generation) retrieves documents and injects them into an LLM's context window. It is a bandwidth optimization for context windows. It does not model constraints. It does not track supersession. It does not enforce anything.

Contextly is not a RAG system. RAG retrieves documents; Contextly propagates constraints. RAG is passive (retrieve on query); Contextly is active (inject on session start, block on violation). RAG answers "what is relevant?"; Contextly answers "what applies?"

### A Document Store

Document stores hold human-authored content — specifications, design docs, runbooks. They are static. They require humans to write, update, and deprecate content. They do not automatically propagate or enforce anything.

Contextly is not a document store. Claims are created by agents as they work, not by humans writing docs. Claims are automatically superseded. Claims are checked for consistency automatically. A document store is a library; Contextly is a compiler.

### An Agent Memory

Agent memory systems (Mem0, Zep) store per-user, per-agent conversational context. They are scoped to a single agent-user relationship. They do not compose across agents. They do not model project-level constraints.

Contextly is not an agent memory system. It is not per-agent. It is per-workspace, which may contain many agents. It is not conversational. It is constraint-oriented. Agent memory is "what did we talk about?" Contextly is "what did we decide?"

### A Configuration Management System

Configuration management stores environment variables, feature flags, and deployment configs. It is machine-oriented, not decision-oriented. A config change is a deployment event, not a constraint.

Contextly is not configuration management. A Claim about "the database URL is `postgres://...`" looks like a config entry but functions differently: it is a constraint on all database-dependent decisions, traceable to its provenance, with a certainty that decays over time, linked to parent Claims about the infrastructure decision.