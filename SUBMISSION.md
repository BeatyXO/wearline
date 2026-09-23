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
- GitHub: https://github.com/BeatyXO/wearline
- Hosted frontend: https://wearline.vercel.app/

## Reviewer proof checklist

- [x] GenVM lint passes.
- [x] Direct Mode suite passes (27/27).
- [x] Source-invariant suite passes.
- [x] Frontend typecheck passes.
- [x] Frontend production build passes.
- [ ] StudioNet source/schema parity explicitly confirmed.
- [ ] `ACCEPTED` lifecycle demonstrated live.
- [ ] `REMEDIATION_REQUIRED` lifecycle demonstrated live.
- [ ] `REVIEW_REQUIRED` lifecycle demonstrated live.
- [ ] Proof-package revision/correction demonstrated live.
- [ ] Negative hash-integrity behavior demonstrated live.
- [x] `.env.example` files point to the canonical address.
- [ ] Production wallet UX smoke-tested after the latest frontend release.
