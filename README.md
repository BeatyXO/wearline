# Wearline

**Requirement-level physical remediation verification on GenLayer StudioNet (chain ID `61999`).**

Wearline turns a physical work scope into a frozen set of atomic acceptance criteria, lets the assigned remediator submit a bounded completion-proof package for each criterion, and uses GenLayer consensus to determine whether each requirement is actually satisfied. Deterministic contract logic then aggregates the requirement verdicts into the final work-order result.

Wearline is a **specification-compliance primitive**. There are no deposits, deductions, prices, payouts, escrow balances, or transfer methods.

## Core primitive

```text
Work order
   ↓
Frozen scope
   ↓
Atomic acceptance requirements
   ↓
1–2 hash-pinned completion artifacts per requirement
   ↓
Independent GenLayer requirement verification
   ↓
Deterministic compliance report
```

The semantic question is narrowly bounded:

> **Does this completion proof establish that this exact frozen acceptance criterion is satisfied?**

The model cannot invent additional workmanship standards, prices, liability rules, or consequences.

## Why GenLayer is required

A deterministic contract can freeze participants, scope, acceptance criteria, evidence guidance, HTTPS evidence locations, SHA-256 digests, workflow state, and aggregation rules. It cannot reliably inspect physical completion photographs and determine whether a natural-language acceptance criterion has actually been demonstrated.

Wearline puts only that bounded requirement-level judgment through GenLayer:

1. The requester freezes the work scope and atomic requirements before proof is submitted.
2. The remediator supplies one or two completion images for each requirement.
3. Every supplied image is fetched inside nondeterministic execution and SHA-256 verified before model evaluation.
4. Leader and validators independently evaluate the same frozen criterion against the same proof package.
5. Validators compare only consequential fields: `verdict` and `evidence_sufficient`. Free-form reasoning is retained for review but does not control consensus.
6. The contract derives the final work-order result from the finalized requirement verdicts.

## Verdict model

| Verdict | Meaning |
| --- | --- |
| `SATISFIED` | The proof reliably demonstrates the full frozen acceptance criterion. |
| `PARTIALLY_SATISFIED` | Meaningful completion is demonstrated, but a material part of the criterion remains unmet. |
| `NOT_SATISFIED` | The proof reliably demonstrates that the criterion is not materially satisfied. |
| `INCONCLUSIVE` | The proof is insufficient or unsuitable for a reliable determination. |

`INCONCLUSIVE` requires `evidence_sufficient = false`. Every conclusive verdict requires `evidence_sufficient = true`.

After every requirement is verified:

- all requirements `SATISFIED` → `ACCEPTED`;
- any `PARTIALLY_SATISFIED` or `NOT_SATISFIED` → `REMEDIATION_REQUIRED`;
- any `INCONCLUSIVE` → `REVIEW_REQUIRED`.

`REVIEW_REQUIRED` takes precedence because an uncertain requirement can never silently produce acceptance.

## Contract surface

Write methods:

- `create_work_order(remediator, title, scope_summary)`
- `add_requirement(work_order_id, label, acceptance_criterion, evidence_guidance)`
- `seal_work_order(work_order_id)`
- `submit_evidence_package(work_order_id, requirement_index, evidence_note, url1, sha1, url2, sha2)`
- `verify_requirement(work_order_id, requirement_index)`

View methods:

- `get_work_order(work_order_id)`
- `get_requirement(work_order_id, requirement_index)`
- `get_requirement_count(work_order_id)`
- `get_next_work_order_id()`
- `get_latest_work_order_for_requester(requester)`

There are no payable write methods and no native-token transfer interface.

## Evidence model

Each requirement freezes:

- a short label;
- one atomic natural-language acceptance criterion;
- evidence guidance describing what completion proof should show.

The remediator can submit or replace the **unverified** proof package. Each package contains:

- an evidence note, treated as an untrusted claim rather than proof;
- one required completion artifact;
- one optional second completion artifact;
- one SHA-256 digest for every supplied artifact;
- a monotonic evidence revision number.

Once a requirement has been verified, its proof package and verdict are immutable.

## Security and consensus properties

- HTTPS evidence only.
- JPEG, PNG and WebP only.
- Maximum two artifacts per requirement.
- SHA-256 is checked before model evaluation.
- Visible text inside images is explicitly untrusted data.
- The remediator's evidence note is explicitly untrusted.
- Model output must contain exactly `verdict`, `evidence_sufficient`, and `reasoning`.
- Closed verdict vocabulary.
- Consequential fields are independently reproduced by validators.
- Reasoning differences cannot change consensus.
- `INCONCLUSIVE` fails closed.
- Requirement registration is frozen once the work order is sealed.
- No privileged method can force `SATISFIED`.
- No financial state or transfer surface exists.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md), and [`docs/DESIGN_BOUNDARY.md`](docs/DESIGN_BOUNDARY.md).

## Frontend

The React/Vite reviewer interface mirrors the new lifecycle:

- **Overview** — explains the requirement-compliance primitive;
- **Work order** — create/load work orders and freeze atomic requirements;
- **Completion proof** — submit up to two proof artifacts, compute local SHA-256 values, replace unverified packages, and invoke GenLayer verification;
- **Compliance report** — inspect every requirement verdict and the deterministic aggregate result.

The wallet path uses an injected EIP-1193 provider and targets StudioNet `61999` only.

```bash
cd frontend
npm install
cp .env.example .env
npm run typecheck
npm run build
npm run dev
```

## Quality checks

```bash
python -m pip install -r requirements-test.txt
genvm-lint check contracts/Wearline.py
gltest tests/direct_mode_suite.py -q
python -m unittest tests/test_source_invariants.py -v
python scripts/check_stale_terms.py
cd frontend && npm install && npm run typecheck && npm run build
```

## Deployment status

**Awaiting first canonical deployment.** Both `.env.example` files intentionally leave `VITE_WEARLINE_CONTRACT_ADDRESS` blank until deployment and source parity are proven.

The StudioNet address, deployment transaction, source commit, source SHA-256, and live lifecycle transactions belong in [`DEPLOYMENT.md`](DEPLOYMENT.md) and [`SUBMISSION.md`](SUBMISSION.md) after deployment.
