from __future__ import annotations

import base64
import hashlib
import json
import os
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
CONTRACT_PATH = ROOT / "contracts" / "Wearline.py"
RPC_URL = os.environ.get("GENLAYER_RPC", "https://studio.genlayer.com/api")
CONTRACT_ADDRESS = os.environ.get(
    "WEARLINE_CONTRACT",
    "0x9229d28C3786821c5D005952d04A9ecf565E46fF",
)
EXPECTED_SHA256 = "9b3ae55724fd2e55ccf81296f31451db527a55c0f8e79119da8732ddbc344594"
EXPECTED_METHODS = {
    "create_work_order",
    "add_requirement",
    "seal_work_order",
    "submit_evidence_package",
    "verify_requirement",
    "get_work_order",
    "get_requirement",
    "get_requirement_count",
    "get_next_work_order_id",
    "get_latest_work_order_for_requester",
}
EXPECTED_WRITES = {
    "create_work_order",
    "add_requirement",
    "seal_work_order",
    "submit_evidence_package",
    "verify_requirement",
}
EXPECTED_VIEWS = EXPECTED_METHODS - EXPECTED_WRITES


def rpc(method: str, params: list[object]) -> object:
    payload = json.dumps({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params,
    }).encode("utf-8")
    request = urllib.request.Request(
        RPC_URL,
        data=payload,
        headers={"content-type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        body = json.loads(response.read().decode("utf-8"))
    if body.get("error"):
        raise RuntimeError(f"{method} failed: {body['error']}")
    if "result" not in body:
        raise RuntimeError(f"{method} returned no result: {body}")
    return body["result"]


def normalize_schema(value: object) -> dict[str, object]:
    if isinstance(value, str):
        value = json.loads(value)
    if not isinstance(value, dict):
        raise RuntimeError(f"unexpected schema type: {type(value).__name__}")
    return value


def main() -> None:
    local_bytes = CONTRACT_PATH.read_bytes()
    local_sha = hashlib.sha256(local_bytes).hexdigest()
    if local_sha != EXPECTED_SHA256:
        raise SystemExit(
            f"local contract hash changed: expected {EXPECTED_SHA256}, got {local_sha}"
        )

    deployed_b64 = rpc("gen_getContractCode", [CONTRACT_ADDRESS])
    if not isinstance(deployed_b64, str):
        raise SystemExit("gen_getContractCode returned a non-string result")
    deployed_bytes = base64.b64decode(deployed_b64)
    deployed_sha = hashlib.sha256(deployed_bytes).hexdigest()

    if deployed_sha != EXPECTED_SHA256:
        raise SystemExit(
            f"deployed source hash mismatch: expected {EXPECTED_SHA256}, got {deployed_sha}"
        )
    if deployed_bytes != local_bytes:
        raise SystemExit(
            "deployed source bytes differ from contracts/Wearline.py despite hash expectation"
        )

    schema = normalize_schema(rpc("gen_getContractSchema", [CONTRACT_ADDRESS]))
    methods = schema.get("methods")
    if not isinstance(methods, dict):
        raise SystemExit(f"schema contains no methods map: {schema}")

    method_names = set(methods)
    if method_names != EXPECTED_METHODS:
        missing = sorted(EXPECTED_METHODS - method_names)
        extra = sorted(method_names - EXPECTED_METHODS)
        raise SystemExit(f"schema method mismatch; missing={missing}, extra={extra}")

    for name in EXPECTED_WRITES:
        info = methods[name]
        if isinstance(info, dict):
            if info.get("readonly") is True:
                raise SystemExit(f"write method {name} is marked readonly")
            if info.get("payable") is True:
                raise SystemExit(f"write method {name} is unexpectedly payable")

    for name in EXPECTED_VIEWS:
        info = methods[name]
        if isinstance(info, dict) and info.get("readonly") is False:
            raise SystemExit(f"view method {name} is not marked readonly")

    print("WEARLINE DEPLOYMENT PARITY: PASS")
    print(f"contract={CONTRACT_ADDRESS}")
    print(f"rpc={RPC_URL}")
    print(f"sha256={deployed_sha}")
    print(f"source_bytes={len(deployed_bytes)}")
    print("methods=" + ",".join(sorted(method_names)))


if __name__ == "__main__":
    main()
