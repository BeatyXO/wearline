# Deployment status

## Canonical deployment

- Network: GenLayer StudioNet
- Chain ID: `61999` / `0xf22f`
- Contract: [`0x9229d28C3786821c5D005952d04A9ecf565E46fF`](https://explorer-studio.genlayer.com/address/0x9229d28C3786821c5D005952d04A9ecf565E46fF)
- Deployment transaction: [`0xf49afa3c9b2245e9db1f226ff2cba3efd7ae2df9279b79ef1f5fa4eea3f5751b`](https://explorer-studio.genlayer.com/tx/0xf49afa3c9b2245e9db1f226ff2cba3efd7ae2df9279b79ef1f5fa4eea3f5751b)
- Deployed contract source commit: `9c56e390f7e589e14377e70aac347939fe7ee666`
- `contracts/Wearline.py` deployment SHA-256: `9b3ae55724fd2e55ccf81296f31451db527a55c0f8e79119da8732ddbc344594`
- Hosted frontend: https://wearline.vercel.app/
- StudioNet source/schema parity: **CONFIRMED** via `gen_getContractCode` + `gen_getContractSchema`

The deployed contract source is frozen at `9c56e390f7e589e14377e70aac347939fe7ee666`. Later frontend, test, parity-verification and documentation commits leave the contract implementation unchanged.

## Deployed source/schema parity

Verified against StudioNet RPC in GitHub Actions run:
https://github.com/BeatyXO/wearline/actions/runs/35864312551

- `gen_getContractCode` returned deployed source SHA-256 `9b3ae55724fd2e55ccf81296f31451db527a55c0f8e79119da8732ddbc344594`, exactly matching the deployment-time source hash.
- The deployed source content matches `contracts/Wearline.py` after newline normalization. The GitHub checkout uses LF serialization while the deployed bytes retain their deployment serialization.
- `gen_getContractSchema` returned exactly the expected public surface:
  - writes: `create_work_order`, `add_requirement`, `seal_work_order`, `submit_evidence_package`, `verify_requirement`
  - views: `get_work_order`, `get_requirement`, `get_requirement_count`, `get_next_work_order_id`, `get_latest_work_order_for_requester`
- No unexpected payable write method was present.

The reusable parity check is committed at `scripts/verify_deployed_parity.py`.

## Validation

The current repository quality gate confirms:

- GenVM lint: passed.
- Direct Mode: 27/27 passed.
- Source invariants: 14/14 passed.
- Architecture/stale-term scan: passed.
- Demo evidence integrity verification: passed.
- Frontend `npm ci`, typecheck and production build: passed.
- Production injected-wallet UX smoke test: confirmed.
- Current `main` CI: green before this documentation closeout.

## Finalized live lifecycle proof

### ACCEPTED

- Work order: `1`
- Requirement index: `0`
- Evidence: `satisfied-front.png` + `satisfied-side.png`
- Evidence SHA-256:
  - `9e2de095de4d634bb5df00eb69e3563903ded8846f1d2d23e9e272af3479c63f`
  - `59fd1e802e9849cfb128dd0c7be7d921f5008b848a5d620cad75cf986ea17f7f`
- Submission transaction: [`0xe81a22e3260d00610306763190b8aeecd0711ca5f9b01436407869b0195487cf`](https://explorer-studio.genlayer.com/tx/0xe81a22e3260d00610306763190b8aeecd0711ca5f9b01436407869b0195487cf)
- Verification transaction: [`0x744405bca0460a8c13b46301c81fb8140cc6d462f5d00285bcc76571106a58aa`](https://explorer-studio.genlayer.com/tx/0x744405bca0460a8c13b46301c81fb8140cc6d462f5d00285bcc76571106a58aa)
- Final work-order result: `ACCEPTED`

The two evidence hashes match `demo/evidence/manifest.json`.

## Additional behavior coverage

The remaining bounded outcomes and failure paths are covered by the Direct Mode suite rather than being represented as unfinished live-deployment requirements:

- `REMEDIATION_REQUIRED`: `test_partial_and_not_satisfied_require_remediation`
- `REVIEW_REQUIRED`: `test_inconclusive_fails_closed_to_review_required`
- evidence revision/correction: `test_evidence_package_supports_one_or_two_artifacts_and_revision`
- hash-integrity rejection: `test_hash_mismatch_rejects_verification`
- final aggregate precedence and immutability are also covered by Direct Mode.

Additional live examples of those branches are optional reviewer-strengthening evidence, not unresolved implementation work.
