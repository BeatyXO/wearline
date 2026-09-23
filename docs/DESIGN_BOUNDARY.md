# Design boundary

Wearline is intentionally defined by what consensus proves:

**A frozen acceptance criterion has (or has not) been demonstrated by a bounded completion-proof package.**

The contract is not a chronological condition-delta classifier. Completion images are complementary proof views evaluated directly against the written specification; the protocol does not require an earlier state image.

The contract is also non-financial: it contains no value-bearing write method or transfer surface.

These boundaries are enforced by source-invariant tests and `scripts/check_stale_terms.py` so later product work cannot accidentally introduce prohibited comparison or financial behavior.
