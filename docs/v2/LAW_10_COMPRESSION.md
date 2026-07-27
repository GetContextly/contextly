# Law 10: Law of Compression

**A set of related Claims can be compressed into a single summary Claim if and only if doing so does not lose information required by the current active constraint set.**

Compression is lossless with respect to active constraints. It may lose historical detail (which is available in the full DAG via the Law of Reversibility). The compression threshold depends on workspace size and age.

*Rationale:* Over time, the DAG grows. Historical Claims about trivial implementation details are noise. Compression collapses them into summary Claims, preserving the constraint set while reducing graph size.