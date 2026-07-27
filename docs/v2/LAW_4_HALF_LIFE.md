# Law 4: Law of Half-Life

**Every Claim has a half-life parameter. After one half-life from its timestamp, its certainty decays by half. After five half-lives, it enters `expired` status.**

Half-life is set based on provenance:
- `decision` by human: half-life = 1 year
- `decision` by agent: half-life = 90 days
- `observation`: half-life = 30 days (or tied to the observation frequency)
- `derived`: half-life = minimum of parents' half-lives

*Rationale:* Context decays. A database decision from 2023 is less reliable than one from 2026. The half-life mechanism ensures the system automatically deprioritizes stale context rather than requiring manual review.