# Law 8: Law of Reversibility

**A superseded Claim is never deleted. It remains in the graph with status `superseded`. The system can reconstruct the full history of a constraint by tracing its supersession chain.**

This is the Git model. No information is lost. The active constraint set is the frontier of the DAG — the superseded Claims are the history.

*Rationale:* The decision history is as important as the current constraints. Understanding why a constraint was replaced is essential for future reasoning.