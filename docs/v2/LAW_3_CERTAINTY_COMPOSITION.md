# Law 3: Law of Certainty Composition

**A derived Claim inherits the minimum certainty of its parents, modified by the reliability of the derivation rule.**

```
certainty(Claim_C) = min(certainty(Claim_A), certainty(Claim_B)) * reliability(derivation_rule)
```

If Claim A has certainty 0.95 and Claim B has certainty 0.70, and the inference rule is 90% reliable, the derived Claim has certainty 0.70 * 0.90 = 0.63.

*Rationale:* Certainty should decrease, not increase, along derivation chains. If a fact is uncertain, anything built on it is at most as certain.