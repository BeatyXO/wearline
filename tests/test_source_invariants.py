import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
CONTRACT = (ROOT / "contracts" / "Wearline.py").read_text(encoding="utf-8")
FRONTEND_ROOT = ROOT / "frontend" / "src"
FRONTEND = "\n".join(
    path.read_text(encoding="utf-8", errors="ignore")
    for path in FRONTEND_ROOT.rglob("*")
    if path.is_file() and path.suffix in {".ts", ".tsx"}
)
README = (ROOT / "README.md").read_text(encoding="utf-8")


class SourceInvariantTests(unittest.TestCase):
    def test_single_contract_file(self):
        contracts = list((ROOT / "contracts").glob("*.py"))
        self.assertEqual([path.name for path in contracts], ["Wearline.py"])

    def test_genvm_dependency_is_pinned(self):
        self.assertTrue(CONTRACT.startswith('# { "Depends": "py-genlayer:'))

    def test_runtime_targets_only_studionet_61999(self):
        runtime_files = [
            ROOT / "contracts" / "Wearline.py",
            ROOT / "frontend" / "src" / "lib" / "genlayer.ts",
            ROOT / ".env.example",
        ]
        runtime_text = "\n".join(
            p.read_text(encoding="utf-8", errors="ignore") for p in runtime_files
        ).lower()
        self.assertNotIn("testnetbradbury", runtime_text)
        self.assertNotIn("61997", runtime_text)
        self.assertIn("61999", runtime_text)
        self.assertIn("studionet", runtime_text)

    def test_core_primitive_is_requirement_compliance(self):
        self.assertIn("WEARLINE_REQUIREMENT_VERIFIER", CONTRACT)
        self.assertIn("Frozen acceptance criterion", CONTRACT)
        for forbidden in (
            "baseline_url", "baseline_sha256", "completion_url", "completion_sha256",
            "move_in", "move_out", "NORMAL_WEAR", "NEW_DAMAGE", "MISSING",
        ):
            self.assertNotIn(forbidden, CONTRACT)

    def test_consensus_replays_and_compares_only_consequential_fields(self):
        self.assertIn("validator_data = assess()", CONTRACT)
        self.assertIn('leader_data["verdict"] == validator_data["verdict"]', CONTRACT)
        self.assertIn('leader_data["evidence_sufficient"]', CONTRACT)
        self.assertNotIn('leader_data["reasoning"]', CONTRACT)

    def test_multi_artifact_completion_proof_is_hash_checked_before_model(self):
        hash_pos = CONTRACT.index("hashlib.sha256(body)")
        model_pos = CONTRACT.index("gl.nondet.exec_prompt")
        self.assertLess(hash_pos, model_pos)
        self.assertIn("evidence_url_1", CONTRACT)
        self.assertIn("evidence_url_2", CONTRACT)
        self.assertNotIn("evidence_url_3", CONTRACT)
        self.assertIn("response.status", CONTRACT)

    def test_closed_verdict_model(self):
        expected = {
            "SATISFIED",
            "PARTIALLY_SATISFIED",
            "NOT_SATISFIED",
            "INCONCLUSIVE",
        }
        constants = set(re.findall(r'VERDICT_[A-Z_]+ = "([A-Z_]+)"', CONTRACT))
        self.assertEqual(constants, expected)

    def test_public_write_surface_matches_new_primitive(self):
        methods = set(re.findall(r"@gl\.public\.write\s+def\s+(\w+)", CONTRACT))
        self.assertEqual(methods, {
            "create_work_order",
            "add_requirement",
            "seal_work_order",
            "submit_evidence_package",
            "verify_requirement",
        })

    def test_no_financial_or_settlement_surface(self):
        self.assertNotIn("@gl.public.write.payable", CONTRACT)
        self.assertNotIn("emit_" + "transfer", CONTRACT)
        lower = CONTRACT.lower()
        for forbidden in ("deposit_wei", "deduction_wei", "landlord:", "tenant:", "payout_reserve"):
            self.assertNotIn(forbidden, lower)

    def test_frontend_uses_new_contract_surface(self):
        for method in (
            "create_work_order", "add_requirement", "seal_work_order",
            "submit_evidence_package", "verify_requirement", "get_work_order",
            "get_requirement", "get_latest_work_order_for_requester",
        ):
            self.assertIn(method, FRONTEND)

    def test_frontend_stays_within_requirement_compliance_boundary(self):
        lower = FRONTEND.lower()
        for forbidden in ("move-in", "move-out", "normal wear", "new damage", "security deposit"):
            self.assertNotIn(forbidden, lower)

    def test_completion_artifact_limit_is_consistent(self):
        public_copy = (FRONTEND + "\n" + README).lower()
        self.assertNotIn("up to three", public_copy)
        self.assertNotIn("one to three", public_copy)
        self.assertIn("one or two", public_copy)
        self.assertNotIn("evidence_url_3", CONTRACT)

    def test_wallet_release_controls_are_present(self):
        app_layout = (ROOT / "frontend" / "src" / "components" / "AppLayout.tsx").read_text(encoding="utf-8")
        context = (ROOT / "frontend" / "src" / "context" / "WearlineContext.tsx").read_text(encoding="utf-8")
        genlayer = (ROOT / "frontend" / "src" / "lib" / "genlayer.ts").read_text(encoding="utf-8")

        self.assertIn("Switch to StudioNet", app_layout)
        self.assertIn("Copy address", app_layout)
        self.assertIn("Disconnect", app_layout)
        self.assertIn("switchNetwork", context)
        self.assertIn("disconnect", context)
        self.assertIn("errorMessage(cause)", context)
        self.assertIn("wallet_switchEthereumChain", genlayer)
        self.assertIn("wallet_revokePermissions", genlayer)
        self.assertIn("wearline.wallet.disconnected", genlayer)

    def test_canonical_deployment_is_configured(self):
        expected = "VITE_WEARLINE_CONTRACT_ADDRESS=0x9229d28C3786821c5D005952d04A9ecf565E46fF"
        self.assertEqual((ROOT / ".env.example").read_text(encoding="utf-8").strip(), expected)
        self.assertEqual((ROOT / "frontend" / ".env.example").read_text(encoding="utf-8").strip(), expected)


if __name__ == "__main__":
    unittest.main()
