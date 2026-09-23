# Design boundary

Wearline is defined by one consensus question:

**Has a frozen physical-work acceptance criterion been demonstrated by the submitted completion-proof package?**

Each requirement is evaluated directly against its written specification. A proof package contains one or two complementary completion artifacts, and the contract records only the bounded requirement verdict, evidence-sufficiency flag, reasoning, and deterministic aggregate result.

Wearline produces an auditable compliance record. It does not custody or transfer value.

These boundaries are enforced by source-invariant tests and `scripts/check_stale_terms.py` so later product work cannot broaden the contract beyond requirement-level completion verification.
