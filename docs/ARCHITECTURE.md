# Wearline architecture

## Product boundary

Wearline is a **physical work specification-compliance protocol**. Its job is to answer a series of bounded requirement-level questions and produce an auditable final compliance report.

It does not compare tenancy condition, calculate damage, hold deposits, price repairs, determine liability, or move funds.

## State model

### Work order

A work order binds:

- requester;
- remediator;
- title;
- frozen scope summary;
- requirement count;
- verified count;
- workflow status;
- final result.

Lifecycle:

```text
DRAFT → SEALED → REVIEWING → VERIFIED
```

`DRAFT` is the only phase in which requirements may be registered. `SEALED` freezes the specification. `REVIEWING` begins after the first completion-proof package is submitted. `VERIFIED` is reached only when every registered requirement has a finalized verdict.

### Requirement

Each requirement is intentionally atomic. It binds:

- label;
- acceptance criterion;
- evidence guidance;
- current proof-package revision;
- one or two evidence URLs and SHA-256 digests;
- evidence note;
- final verdict;
- evidence-sufficiency flag;
- reviewer reasoning.

Atomic requirements keep the nondeterministic question narrow. Complex work should be represented as several requirements rather than one broad "is the whole job good?" prompt.

## Proof-package revision model

The assigned remediator may replace an unverified proof package. Every valid submission increments `evidence_revision`. This supports correction of a bad URL, framing, or hash without changing the already-frozen acceptance criterion.

After verification, the requirement cannot receive a new package.

## Consensus boundary

Only one bounded semantic operation is nondeterministic:

> Does the supplied completion proof establish the frozen acceptance criterion?

The leader and validators independently:

1. fetch every supplied HTTPS artifact;
2. require a supported image MIME type;
3. verify the frozen SHA-256 digest;
4. evaluate the same work-order scope, atomic criterion, evidence guidance, evidence note, and images;
5. normalize the closed verdict and sufficiency flag.

Validation compares:

- `verdict`;
- `evidence_sufficient`.

It deliberately does not compare free-form reasoning.

## Deterministic aggregation

Once all requirements are verified:

```text
if any INCONCLUSIVE:
    REVIEW_REQUIRED
else if any PARTIALLY_SATISFIED or NOT_SATISFIED:
    REMEDIATION_REQUIRED
else:
    ACCEPTED
```

This gives uncertainty precedence over acceptance and keeps model output away from workflow policy.

## Trust boundary

The requester controls the specification before sealing. The remediator controls the completion-proof package before verification. Neither party controls the consensus verdict. No administrator can rewrite a finalized requirement result.
