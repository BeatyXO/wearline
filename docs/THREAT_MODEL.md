# Threat model

## Malicious or misleading completion evidence

A remediator may submit irrelevant, misleading, or adversarial images. Wearline does not trust filenames, URLs, evidence notes, or visible text. Validators inspect the exact hash-pinned bytes and the prompt explicitly treats visible image text and the evidence note as untrusted data.

## Evidence mutation at the hosting layer

Every artifact is bound to a SHA-256 digest. If the remote bytes change, verification fails before model evaluation.

## Unsupported or unavailable evidence

Only HTTPS JPEG, PNG, and WebP artifacts are accepted. Non-success HTTP responses, missing bodies, unsupported MIME types, and hash mismatches fail verification. Because the requirement remains unverified, a corrected package can be submitted and retried.

## Prompt injection in an image

Visible text may attempt to instruct the model to ignore the criterion or return a preferred verdict. The verification instruction explicitly states that image text is evidence content, never instructions.

## Self-serving evidence note

The remediator controls the evidence note. The prompt labels it an untrusted claim that may help locate details but is not proof.

## Ambiguous proof

`INCONCLUSIVE` is a first-class verdict and requires `evidence_sufficient = false`. Any inconclusive requirement makes the work-order result `REVIEW_REQUIRED`; it can never produce `ACCEPTED`.

## Broad or subjective criteria

The requester could write an overly broad criterion. Wearline mitigates this through product design and length bounds, but cannot make vague requirements objectively precise after sealing. Reviewers should register atomic, observable acceptance criteria.

## Validator disagreement

Validators independently reproduce `verdict` and `evidence_sufficient`. A disagreement rejects validation rather than silently accepting the leader's interpretation.

## Financial manipulation

Out of scope by construction. The contract has no payable write method, no escrow accounting, no price/deduction state, and no token-transfer interface.

## Privileged override

There is no admin method that can force a requirement to `SATISFIED`, rewrite a finalized verdict, or mark a work order accepted.
