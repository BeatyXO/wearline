# Wearline demo evidence

These fixtures are deterministic candidate completion-proof artifacts for reviewer rehearsal and later StudioNet lifecycle proof. They are not claims about an on-chain verdict.

## Frozen demo requirement

**Label:** Electrical enclosure

**Acceptance criterion:** The electrical junction must be fully enclosed in a fixed protective housing, with conduit entering the enclosure and no conductor visibly exposed.

**Evidence guidance:** Provide one or two clear completion views showing the housing, enclosure edges, conduit entry points, and whether any conductor remains visibly exposed.

## Fixture scenarios

- `satisfied-front.png` + `satisfied-side.png`: complementary views of a closed enclosure with no visible conductor outside the housing. Candidate for an `ACCEPTED` lifecycle.
- `remediation-required.png`: an enclosure with conductors visibly extending outside the housing. Candidate for a `REMEDIATION_REQUIRED` lifecycle.
- `review-required.png`: the relevant work area is substantially obstructed, so the criterion cannot be reliably assessed. Candidate for a `REVIEW_REQUIRED` lifecycle.

The authoritative byte digests are in `manifest.json`. Run `python scripts/verify_demo_evidence.py` before using the fixtures. When live proof is produced, record the actual finalized verdicts and transactions rather than assuming these intended scenarios.
