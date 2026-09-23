# Deployment status

## Canonical deployment

- Network: GenLayer StudioNet
- Chain ID: `61999` / `0xf22f`
- Contract: [`0x9229d28C3786821c5D005952d04A9ecf565E46fF`](https://explorer-studio.genlayer.com/address/0x9229d28C3786821c5D005952d04A9ecf565E46fF)
- Deployment transaction: [`0xf49afa3c9b2245e9db1f226ff2cba3efd7ae2df9279b79ef1f5fa4eea3f5751b`](https://explorer-studio.genlayer.com/tx/0xf49afa3c9b2245e9db1f226ff2cba3efd7ae2df9279b79ef1f5fa4eea3f5751b)
- Deployed contract source commit: `9c56e390f7e589e14377e70aac347939fe7ee666`
- `contracts/Wearline.py` SHA-256: `9b3ae55724fd2e55ccf81296f31451db527a55c0f8e79119da8732ddbc344594`
- Hosted frontend: https://wearline.vercel.app/
- StudioNet source/schema parity: **CONFIRMED** via `gen_getContractCode` + `gen_getContractSchema`

The deployed contract source is frozen at `9c56e390f7e589e14377e70aac347939fe7ee666`. Subsequent frontend/documentation commits must leave `contracts/Wearline.py` byte-identical to the deployed source.

## Deployed source/schema parity

Verified against StudioNet RPC in GitHub Actions run:
https://github.com/BeatyXO/wearline/actions/runs/35864312551

- `gen_getContractCode` returned deployed source SHA-256: `9b3ae55724fd2e55ccf81296f31451db527a55c0f8e79119da8732ddbc344594`, exactly matching the recorded deployment-time hash.
- The deployed source content matches `contracts/Wearline.py` after newline normalization. The repository checkout uses a different newline serialization, so its raw checkout SHA differs while normalized source content is identical.
- `gen_getContractSchema` returned exactly the expected public surface:
  - writes: `create_work_order`, `add_requirement`, `seal_work_order`, `submit_evidence_package`, `verify_requirement`
  - views: `get_work_order`, `get_requirement`, `get_requirement_count`, `get_next_work_order_id`, `get_latest_work_order_for_requester`
- No unexpected payable write method was present.

The reusable parity check is committed at `scripts/verify_deployed_parity.py`.

## Validation already confirmed

- GenVM lint: passed in GitHub Actions.
- Direct Mode: 27/27 passed.
- Source invariants: 13/13 passed before deployment metadata wiring.
- Architecture/stale-term scan: passed.
- Demo evidence integrity verification: passed.
- Frontend typecheck/build: passed.
- Deployment source working tree was reported clean at the canonical deployment commit.

## Live lifecycle proof still required

Record finalized StudioNet evidence for:

1. `ACCEPTED` with all requirements `SATISFIED`.
2. `REMEDIATION_REQUIRED` with a `PARTIALLY_SATISFIED` or `NOT_SATISFIED` requirement.
3. `REVIEW_REQUIRED` with an `INCONCLUSIVE` requirement.
4. Proof correction from revision 1 to revision 2 before verification.
5. A negative integrity proof such as a hash mismatch.

For each live case, record the work-order ID, requirement index, transaction hashes, evidence URLs, SHA-256 values, finalized state, verdict/result, and explorer links. Do not mark these complete until the deployed contract has actually finalized the corresponding state.
