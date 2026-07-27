# Law 11: Law of Non-Contradiction

**An agent cannot make a proposal that contradicts an active Claim unless the proposal explicitly includes a supersession directive.**

This is the constraint compiler in action. Before an agent proposes any change, the change is checked against the active Claim set. If a violation is detected, the system returns the violating Claim and blocks the proposal.

*Rationale:* This is the line between a constraint observer and a constraint enforcer. Contextly enforces. An agent cannot "forget" to check — the system checks automatically.