from pathlib import Path
import hashlib
import json
import re

import pytest


ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "contracts" / "Wearline.py"
TITLE = "Pump-room remediation closeout"
SCOPE = "Verify that the contracted physical remediation satisfies the frozen closeout requirements for the pump-room safety work."
CRITERION = "The exposed electrical junction must be fully enclosed in a fixed protective housing with no conductor visibly exposed."
GUIDANCE = "Provide one or two clear completion photographs showing the junction, enclosure edges, and cable entry points."
NOTE = "Closeout photographs show the installed enclosure from front and side angles."


@pytest.fixture
def deployed(direct_deploy):
    return direct_deploy(str(CONTRACT))


def digest(body):
    raw = body.encode() if isinstance(body, str) else body
    return hashlib.sha256(raw).hexdigest()


def mock_image(direct_vm, url, body, *, status=200, content_type="image/jpeg"):
    direct_vm.mock_web(
        re.escape(url),
        {
            "status": status,
            "headers": {"content-type": content_type.encode("ascii")},
            "body": body.encode() if isinstance(body, str) else body,
        },
    )


def mock_verdict(direct_vm, verdict, sufficient=True, reasoning="The supplied completion proof supports the frozen requirement-level determination.", **extra):
    payload = {
        "verdict": verdict,
        "evidence_sufficient": sufficient,
        "reasoning": reasoning,
    }
    payload.update(extra)
    direct_vm.mock_llm("WEARLINE_REQUIREMENT_VERIFIER", json.dumps(payload))


def create_order(contract, direct_vm, requester, remediator, title=TITLE):
    direct_vm.sender = requester
    return contract.create_work_order(str(remediator), title, SCOPE)


def add_requirement(contract, work_order_id, label="Electrical enclosure"):
    return contract.add_requirement(work_order_id, label, CRITERION, GUIDANCE)


def submit_package(contract, direct_vm, remediator, work_order_id, index=0, bodies=("proof-one",), urls=None):
    direct_vm.sender = remediator
    if urls is None:
        urls = tuple(f"https://evidence.test/proof-{i + 1}" for i in range(len(bodies)))
    slots = []
    for i in range(2):
        if i < len(bodies):
            slots.extend([urls[i], digest(bodies[i])])
        else:
            slots.extend(["", ""])
    return contract.submit_evidence_package(work_order_id, index, NOTE, *slots)


def prepare(contract, direct_vm, requester, remediator, *, bodies=("proof-one",)):
    work_order_id = create_order(contract, direct_vm, requester, remediator)
    add_requirement(contract, work_order_id)
    contract.seal_work_order(work_order_id)
    submit_package(contract, direct_vm, remediator, work_order_id, bodies=bodies)
    return work_order_id


def arrange(contract, direct_vm, requester, remediator, verdict, *, sufficient=True, bodies=("proof-one",)):
    work_order_id = prepare(contract, direct_vm, requester, remediator, bodies=bodies)
    for i, body in enumerate(bodies):
        mock_image(direct_vm, f"https://evidence.test/proof-{i + 1}", body)
    mock_verdict(direct_vm, verdict, sufficient=sufficient)
    return work_order_id


def verify_single(contract, direct_vm, requester, remediator, verdict, *, sufficient=True, bodies=("proof-one",)):
    work_order_id = arrange(
        contract, direct_vm, requester, remediator, verdict,
        sufficient=sufficient, bodies=bodies,
    )
    contract.verify_requirement(work_order_id, 0)
    assert direct_vm.run_validator() is True
    return work_order_id


def test_allocates_monotonic_work_order_ids(deployed, direct_vm, direct_alice, direct_bob):
    assert deployed.get_next_work_order_id() == 1
    first = create_order(deployed, direct_vm, direct_alice, direct_bob)
    second = create_order(deployed, direct_vm, direct_alice, direct_bob, "Second closeout package")
    assert (first, second) == ("1", "2")
    state = deployed.get_work_order(first)
    assert state.requester == direct_alice
    assert state.remediator == direct_bob
    assert state.status == "DRAFT"


def test_work_order_validates_title_scope_and_address(deployed, direct_vm, direct_alice, direct_bob):
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("work order title must be between"):
        deployed.create_work_order(str(direct_bob), "x", SCOPE)
    with direct_vm.expect_revert("scope summary must be between"):
        deployed.create_work_order(str(direct_bob), TITLE, "short")
    with pytest.raises(Exception):
        deployed.create_work_order("not-an-address", TITLE, SCOPE)


def test_requester_registers_atomic_requirement(deployed, direct_vm, direct_alice, direct_bob):
    work_order_id = create_order(deployed, direct_vm, direct_alice, direct_bob)
    index = add_requirement(deployed, work_order_id)
    item = deployed.get_requirement(work_order_id, index)
    assert item.acceptance_criterion == CRITERION
    assert item.evidence_guidance == GUIDANCE
    assert item.evidence_count == 0
    assert item.verified is False


def test_non_requester_cannot_register_requirement(deployed, direct_vm, direct_alice, direct_bob, direct_charlie):
    work_order_id = create_order(deployed, direct_vm, direct_alice, direct_bob)
    with direct_vm.prank(direct_charlie), direct_vm.expect_revert("requester only"):
        add_requirement(deployed, work_order_id)


def test_requirement_text_is_validated(deployed, direct_vm, direct_alice, direct_bob):
    work_order_id = create_order(deployed, direct_vm, direct_alice, direct_bob)
    with direct_vm.expect_revert("acceptance criterion must be between"):
        deployed.add_requirement(work_order_id, "Electrical", "too short", GUIDANCE)
    with direct_vm.expect_revert("evidence guidance must be between"):
        deployed.add_requirement(work_order_id, "Electrical", CRITERION, "short")


def test_empty_work_order_cannot_be_sealed(deployed, direct_vm, direct_alice, direct_bob):
    work_order_id = create_order(deployed, direct_vm, direct_alice, direct_bob)
    with direct_vm.expect_revert("add at least one requirement before sealing"):
        deployed.seal_work_order(work_order_id)


def test_sealing_freezes_requirement_registration(deployed, direct_vm, direct_alice, direct_bob):
    work_order_id = create_order(deployed, direct_vm, direct_alice, direct_bob)
    add_requirement(deployed, work_order_id)
    deployed.seal_work_order(work_order_id)
    state = deployed.get_work_order(work_order_id)
    assert state.sealed is True
    assert state.status == "SEALED"
    with direct_vm.expect_revert("work order is already sealed"):
        add_requirement(deployed, work_order_id, "Second criterion")


def test_only_remediator_can_submit_completion_proof(deployed, direct_vm, direct_alice, direct_bob, direct_charlie):
    work_order_id = create_order(deployed, direct_vm, direct_alice, direct_bob)
    add_requirement(deployed, work_order_id)
    deployed.seal_work_order(work_order_id)
    with direct_vm.prank(direct_charlie), direct_vm.expect_revert("remediator only"):
        deployed.submit_evidence_package(
            work_order_id, 0, NOTE,
            "https://evidence.test/proof", "a" * 64,
            "", "",
        )


def test_evidence_package_supports_one_or_two_artifacts_and_revision(deployed, direct_vm, direct_alice, direct_bob):
    work_order_id = create_order(deployed, direct_vm, direct_alice, direct_bob)
    add_requirement(deployed, work_order_id)
    deployed.seal_work_order(work_order_id)
    rev1 = submit_package(deployed, direct_vm, direct_bob, work_order_id, bodies=("a", "b"))
    req = deployed.get_requirement(work_order_id, 0)
    assert int(req.evidence_count) == 2
    assert int(rev1) == 1
    rev2 = submit_package(deployed, direct_vm, direct_bob, work_order_id, bodies=("corrected",))
    req = deployed.get_requirement(work_order_id, 0)
    assert int(req.evidence_count) == 1
    assert int(rev2) == 2
    assert req.evidence_url_2 == ""


def test_evidence_package_rejects_bad_url_and_bad_hash(deployed, direct_vm, direct_alice, direct_bob):
    work_order_id = create_order(deployed, direct_vm, direct_alice, direct_bob)
    add_requirement(deployed, work_order_id)
    deployed.seal_work_order(work_order_id)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("must use https"):
        deployed.submit_evidence_package(
            work_order_id, 0, NOTE,
            "http://evidence.test/one", "a" * 64,
            "", "",
        )
    with direct_vm.expect_revert("sha256 must be 64"):
        deployed.submit_evidence_package(
            work_order_id, 0, NOTE,
            "https://evidence.test/one", "bad",
            "", "",
        )


def test_submission_moves_work_order_to_reviewing(deployed, direct_vm, direct_alice, direct_bob):
    work_order_id = prepare(deployed, direct_vm, direct_alice, direct_bob)
    assert deployed.get_work_order(work_order_id).status == "REVIEWING"
    req = deployed.get_requirement(work_order_id, 0)
    assert req.evidence_note == NOTE
    assert req.evidence_revision == 1


def test_hash_mismatch_rejects_verification(deployed, direct_vm, direct_alice, direct_bob):
    work_order_id = prepare(deployed, direct_vm, direct_alice, direct_bob, bodies=("original",))
    mock_image(direct_vm, "https://evidence.test/proof-1", "replacement")
    with direct_vm.expect_revert("completion proof 1 hash mismatch"):
        deployed.verify_requirement(work_order_id, 0)
    assert deployed.get_requirement(work_order_id, 0).verified is False


def test_unsupported_evidence_type_rejects_verification(deployed, direct_vm, direct_alice, direct_bob):
    work_order_id = prepare(deployed, direct_vm, direct_alice, direct_bob)
    mock_image(direct_vm, "https://evidence.test/proof-1", "proof-one", content_type="text/html")
    with direct_vm.expect_revert("supported JPEG, PNG, or WebP"):
        deployed.verify_requirement(work_order_id, 0)


def test_multi_artifact_package_is_evaluated_as_one_requirement_proof(deployed, direct_vm, direct_alice, direct_bob):
    work_order_id = verify_single(
        deployed, direct_vm, direct_alice, direct_bob,
        "SATISFIED", sufficient=True, bodies=("front", "side"),
    )
    req = deployed.get_requirement(work_order_id, 0)
    assert req.evidence_count == 2
    assert req.verdict == "SATISFIED"
    assert req.evidence_sufficient is True


def test_satisfied_requirement_accepts_work_order(deployed, direct_vm, direct_alice, direct_bob):
    work_order_id = verify_single(deployed, direct_vm, direct_alice, direct_bob, "SATISFIED")
    state = deployed.get_work_order(work_order_id)
    assert state.status == "VERIFIED"
    assert state.result == "ACCEPTED"


def test_partial_and_not_satisfied_require_remediation(deployed, direct_vm, direct_alice, direct_bob):
    for verdict in ("PARTIALLY_SATISFIED", "NOT_SATISFIED"):
        work_order_id = verify_single(deployed, direct_vm, direct_alice, direct_bob, verdict)
        assert deployed.get_work_order(work_order_id).result == "REMEDIATION_REQUIRED"


def test_inconclusive_fails_closed_to_review_required(deployed, direct_vm, direct_alice, direct_bob):
    work_order_id = verify_single(
        deployed, direct_vm, direct_alice, direct_bob,
        "INCONCLUSIVE", sufficient=False,
    )
    assert deployed.get_work_order(work_order_id).result == "REVIEW_REQUIRED"


def test_inconclusive_requires_insufficient_evidence_flag(deployed, direct_vm, direct_alice, direct_bob):
    work_order_id = arrange(deployed, direct_vm, direct_alice, direct_bob, "INCONCLUSIVE", sufficient=True)
    with direct_vm.expect_revert("INCONCLUSIVE requires insufficient evidence"):
        deployed.verify_requirement(work_order_id, 0)


def test_conclusive_verdict_requires_sufficient_evidence_flag(deployed, direct_vm, direct_alice, direct_bob):
    work_order_id = arrange(deployed, direct_vm, direct_alice, direct_bob, "SATISFIED", sufficient=False)
    with direct_vm.expect_revert("conclusive verdict requires sufficient evidence"):
        deployed.verify_requirement(work_order_id, 0)


def test_extra_model_field_is_rejected(deployed, direct_vm, direct_alice, direct_bob):
    work_order_id = prepare(deployed, direct_vm, direct_alice, direct_bob)
    mock_image(direct_vm, "https://evidence.test/proof-1", "proof-one")
    mock_verdict(direct_vm, "SATISFIED", confidence="high")
    with direct_vm.expect_revert("exactly verdict, evidence_sufficient and reasoning"):
        deployed.verify_requirement(work_order_id, 0)


def test_validator_replays_and_compares_consequential_fields_not_reasoning(deployed, direct_vm, direct_alice, direct_bob):
    work_order_id = arrange(deployed, direct_vm, direct_alice, direct_bob, "SATISFIED", sufficient=True)
    deployed.verify_requirement(work_order_id, 0)
    direct_vm.clear_mocks()
    mock_image(direct_vm, "https://evidence.test/proof-1", "proof-one")
    mock_verdict(
        direct_vm, "SATISFIED", sufficient=True,
        reasoning="Independent validator wording differs while the consequential decision agrees.",
    )
    assert direct_vm.run_validator() is True


def test_validator_disagreement_rejects_consensus(deployed, direct_vm, direct_alice, direct_bob):
    work_order_id = arrange(deployed, direct_vm, direct_alice, direct_bob, "SATISFIED", sufficient=True)
    deployed.verify_requirement(work_order_id, 0)
    direct_vm.clear_mocks()
    mock_image(direct_vm, "https://evidence.test/proof-1", "proof-one")
    mock_verdict(direct_vm, "PARTIALLY_SATISFIED", sufficient=True)
    assert direct_vm.run_validator() is False


def test_final_result_aggregates_multiple_atomic_requirements(deployed, direct_vm, direct_alice, direct_bob):
    work_order_id = create_order(deployed, direct_vm, direct_alice, direct_bob)
    add_requirement(deployed, work_order_id, "Electrical enclosure")
    add_requirement(deployed, work_order_id, "Pipe support")
    deployed.seal_work_order(work_order_id)
    direct_vm.sender = direct_bob

    verdicts = (("SATISFIED", True), ("PARTIALLY_SATISFIED", True))
    for index, (verdict, sufficient) in enumerate(verdicts):
        body = f"proof-{index}"
        url = f"https://evidence.test/r{index}"
        deployed.submit_evidence_package(
            work_order_id, index, NOTE,
            url, digest(body), "", "",
        )
        mock_image(direct_vm, url, body)
        mock_verdict(direct_vm, verdict, sufficient=sufficient)
        deployed.verify_requirement(work_order_id, index)
        assert direct_vm.run_validator() is True
        direct_vm.clear_mocks()

    state = deployed.get_work_order(work_order_id)
    assert state.verified_count == 2
    assert state.status == "VERIFIED"
    assert state.result == "REMEDIATION_REQUIRED"


def test_review_required_takes_precedence_in_aggregate(deployed, direct_vm, direct_alice, direct_bob):
    work_order_id = create_order(deployed, direct_vm, direct_alice, direct_bob)
    add_requirement(deployed, work_order_id, "Electrical enclosure")
    add_requirement(deployed, work_order_id, "Pipe support")
    deployed.seal_work_order(work_order_id)
    direct_vm.sender = direct_bob

    verdicts = (("NOT_SATISFIED", True), ("INCONCLUSIVE", False))
    for index, (verdict, sufficient) in enumerate(verdicts):
        body = f"proof-{index}"
        url = f"https://evidence.test/r{index}"
        deployed.submit_evidence_package(
            work_order_id, index, NOTE,
            url, digest(body), "", "",
        )
        mock_image(direct_vm, url, body)
        mock_verdict(direct_vm, verdict, sufficient=sufficient)
        deployed.verify_requirement(work_order_id, index)
        assert direct_vm.run_validator() is True
        direct_vm.clear_mocks()

    assert deployed.get_work_order(work_order_id).result == "REVIEW_REQUIRED"


def test_verified_requirement_proof_is_immutable(deployed, direct_vm, direct_alice, direct_bob):
    work_order_id = verify_single(deployed, direct_vm, direct_alice, direct_bob, "SATISFIED")
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("work order is not accepting completion proof"):
        submit_package(deployed, direct_vm, direct_bob, work_order_id, bodies=("replacement",))


def test_latest_work_order_for_requester_is_authoritative(deployed, direct_vm, direct_alice, direct_bob):
    first = create_order(deployed, direct_vm, direct_alice, direct_bob)
    second = create_order(deployed, direct_vm, direct_alice, direct_bob, "Second closeout package")
    assert deployed.get_latest_work_order_for_requester(str(direct_alice)) == second
    assert second != first


def test_contract_exposes_no_financial_settlement_path(deployed):
    source = CONTRACT.read_text(encoding="utf-8")
    assert "@gl.public.write.payable" not in source
    assert "emit_" + "transfer" not in source
    for method in ("fund_agreement", "settle", "buy_coverage", "claim_breach_payout"):
        assert not hasattr(deployed, method)
