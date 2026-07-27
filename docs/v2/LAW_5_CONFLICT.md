# Law 5: Law of Conflict

**Two active Claims within the same scope that assert different values for the same (entity, attribute) constitute a conflict. A conflict must be resolved before either Claim can be used as the sole basis for a derived Claim.**

Conflict resolution:
1. If one Claim has `supersededBy` set, the superseding Claim wins.
2. If neither has been superseded, the Claim with higher certainty wins.
3. If certainty is equal, the Claim with higher-authority provenance wins (human > agent, observation > inference).
4. If still tied, the conflict is flagged for human resolution.

*Rationale:* Silent contradictions destroy trust. Conflicts are not errors — they are evidence of active exploration or disagreement. The system surfaces them rather than hiding them.