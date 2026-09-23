# Wearline

**Requirement-level physical work specification-compliance verification on GenLayer StudioNet (chain ID `61999`).**

Wearline turns a physical work scope into a frozen set of atomic acceptance criteria, lets the assigned remediator submit a bounded completion-proof package for each criterion, and uses GenLayer consensus to determine whether each requirement is actually satisfied. Deterministic contract logic then aggregates the requirement verdicts into the final work-order result.

Wearline is a **specification-compliance primitive**. Its output is an auditable compliance record; the contract does not custody or transfer value.

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

The React/Vite reviewer interface mirrors the contract lifecycle:

- **Overview** — explains the requirement-compliance primitive;
- **Work order** — create/load work orders and freeze atomic requirements;
- **Completion proof** — submit up to two proof artifacts, compute local SHA-256 values, replace unverified packages, and invoke GenLayer verification;
- **Compliance report** — inspect every requirement verdict and the deterministic aggregate result.

The wallet path uses an injected EIP-1193 provider and targets StudioNet `61999` only.

```bash
cd frontend
npm ci
cp .env.example .env
npm run typecheck
npm run build
npm run dev
```

## Reproducible demo evidence

Deterministic proof fixtures live in [`demo/evidence/`](demo/evidence/) with recorded SHA-256 digests. The `satisfied-front.png` + `satisfied-side.png` pair has also been used in a real finalized StudioNet lifecycle: work order `1` reached `ACCEPTED` in verification transaction [`0x744405...a58aa`](https://explorer-studio.genlayer.com/tx/0x744405bca0460a8c13b46301c81fb8140cc6d462f5d00285bcc76571106a58aa). The remediation and review fixtures remain deterministic test/demo assets and are not presented as live verdicts.

Run:

```bash
python scripts/verify_demo_evidence.py
```

to verify every committed fixture against its manifest.

## Quality checks

Current CI verifies 27/27 Direct Mode tests, 14/14 source invariants, architecture-boundary checks, demo evidence integrity, frontend typecheck, and the production build. StudioNet deployment parity is verified separately by `scripts/verify_deployed_parity.py`.

```bash
python -m pip install -r requirements-test.txt
genvm-lint check contracts/Wearline.py
gltest tests/direct_mode_suite.py -q
python -m unittest tests/test_source_invariants.py -v
python scripts/check_stale_terms.py
cd frontend && npm ci && npm run typecheck && npm run build
```

## Deployment status

The canonical Wearline contract is deployed on GenLayer StudioNet (chain ID `61999`).

- Contract: [`0x9229d28C3786821c5D005952d04A9ecf565E46fF`](https://explorer-studio.genlayer.com/address/0x9229d28C3786821c5D005952d04A9ecf565E46fF)
- Deployment transaction: [`0xf49afa3c9b2245e9db1f226ff2cba3efd7ae2df9279b79ef1f5fa4eea3f5751b`](https://explorer-studio.genlayer.com/tx/0xf49afa3c9b2245e9db1f226ff2cba3efd7ae2df9279b79ef1f5fa4eea3f5751b)
- Deployed contract source commit: `9c56e390f7e589e14377e70aac347939fe7ee666`
- `contracts/Wearline.py` SHA-256: `9b3ae55724fd2e55ccf81296f31451db527a55c0f8e79119da8732ddbc344594`
- Production frontend: https://wearline.vercel.app/

The contract source is frozen at the deployment commit above. Later frontend, test, parity-verification and documentation commits do not modify the contract implementation. StudioNet source/schema parity is confirmed directly through `gen_getContractCode` and `gen_getContractSchema`. The finalized live `ACCEPTED` proof and full reviewer evidence are recorded in [`DEPLOYMENT.md`](DEPLOYMENT.md) and [`SUBMISSION.md`](SUBMISSION.md).
