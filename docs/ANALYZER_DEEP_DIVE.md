# Technical Deep-Dive: The Semantic Analyzer

The Contextly CLI's primary value proposition is its ability to separate "signal" (Architectural Intent) from "noise" (Refactors, Chores, Typos). This document explains the internal logic of `analyzer.ts`.

## The Extraction Pipeline

### 1. Diff Ingestion
When `contextly sync` is called, the analyzer iterates through the most recent $N$ commits. For each commit, it fetches:
- The full diff body (`git show <sha>`)
- The file statistics (`--stat`)
- The commit message and description.

### 2. Heuristic Classification
We use a set of weighted heuristics to determine if a commit is "Architectural":
- **File Extensions**: Changes to `.sql`, `schema.prisma`, `docker-compose.yml`, or `package.json` (dependency changes) are weighted heavily.
- **Keyword Mapping**: We scan for high-intent verbs like `refactor`, `migrate`, `enforce`, `isolate`, and `implement`.
- **Stat Delta**: Commits that touch many files but have small line deltas are often refactors; commits that touch few files but change core logic are often features.

### 3. Intent Summarization
Once a commit is classified as architectural, we extract the "Reasoning".
- If the commit has a multi-line message, we treat the body as the primary reasoning.
- If it's a single-line message, we attempt to correlate the message with the changed file paths to provide a "Contextual Why".

## Future Roadmap: Local LLM Ingestion
In version 0.2, we plan to support optional **local Ollama ingestion**, allowing the analyzer to use a 1B parameter model locally to generate even higher-fidelity decision summaries without ever sending code to the cloud.
