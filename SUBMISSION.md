# Wearline submission record

## Title

Wearline — Consensus Completion-Proof Verification Against Frozen Work Requirements

## One-line description

A GenLayer work-closeout primitive that freezes atomic physical acceptance criteria, verifies hash-pinned completion proof for each requirement, and deterministically derives the final compliance report.

## Canonical deployment

- StudioNet contract: `0x9229d28C3786821c5D005952d04A9ecf565E46fF`
- Explorer: https://explorer-studio.genlayer.com/address/0x9229d28C3786821c5D005952d04A9ecf565E46fF
- Deployment transaction: `0xf49afa3c9b2245e9db1f226ff2cba3efd7ae2df9279b79ef1f5fa4eea3f5751b`
- Deployment transaction explorer: https://explorer-studio.genlayer.com/tx/0xf49afa3c9b2245e9db1f226ff2cba3efd7ae2df9279b79ef1f5fa4eea3f5751b
- Deployed contract source commit: `9c56e390f7e589e14377e70aac347939fe7ee666`
- Contract SHA-256: `9b3ae55724fd2e55ccf81296f31451db527a55c0f8e79119da8732ddbc344594`
- Source/schema parity proof: https://github.com/BeatyXO/wearline/actions/runs/35864312551
- GitHub: https://github.com/BeatyXO/wearline
- Hosted frontend: https://wearline.vercel.app/

## Finalized StudioNet lifecycle proof

A real end-to-end `ACCEPTED` lifecycle has been finalized on the canonical deployment.

- Work order: `1`
- Requirement index: `0`
- Evidence 1: `satisfied-front.png`
  - SHA-256: `9e2de095de4d634bb5df00eb69e3563903ded8846f1d2d23e9e272af3479c63f`
- Evidence 2: `satisfied-side.png`
  - SHA-256: `59fd1e802e9849cfb128dd0c7be7d921f5008b848a5d620cad75cf986ea17f7f`
- Evidence submission transaction: https://explorer-studio.genlayer.com/tx/0xe81a22e3260d00610306763190b8aeecd0711ca5f9b01436407869b0195487cf
- Verification transaction: https://explorer-studio.genlayer.com/tx/0x744405bca0460a8c13b46301c81fb8140cc6d462f5d00285bcc76571106a58aa
- Final work-order result: `ACCEPTED`

The evidence hashes above match the committed manifest in `demo/evidence/manifest.json`.

## Reviewer proof checklist

- [x] GenVM lint passes.
- [x] Direct Mode suite passes (27/27).
- [x] Source-invariant suite passes (14/14).
- [x] Architecture/stale-term scan passes.
- [x] Demo evidence integrity verification passes.
- [x] Frontend typecheck passes.
- [x] Frontend production build passes.
- [x] StudioNet source/schema parity explicitly confirmed via StudioNet RPC.
- [x] Real `ACCEPTED` lifecycle demonstrated on the canonical StudioNet deployment.
- [x] `REMEDIATION_REQUIRED` behavior covered by Direct Mode.
- [x] `REVIEW_REQUIRED` behavior covered by Direct Mode.
- [x] Proof-package revision/correction behavior covered by Direct Mode.
- [x] Negative hash-integrity behavior covered by Direct Mode.
- [x] `.env.example` files point to the canonical address.
- [x] Production injected-wallet UX smoke-tested on the hosted frontend.

Additional live negative/outcome transactions can strengthen reviewer evidence but are not required to establish the implemented and tested contract behavior.
