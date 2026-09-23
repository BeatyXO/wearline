from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = (ROOT / "contracts" / "Wearline.py").read_text(encoding="utf-8").lower()
FRONTEND = "\n".join(
    path.read_text(encoding="utf-8", errors="ignore").lower()
    for path in (ROOT / "frontend" / "src").rglob("*")
    if path.is_file() and path.suffix in {".ts", ".tsx"}
)

contract_forbidden = {
    "baseline_url": "prohibited baseline evidence field",
    "baseline_sha256": "prohibited baseline evidence field",
    "completion_url": "prohibited legacy evidence field",
    "move_in": "property-condition comparison semantics",
    "move_out": "property-condition comparison semantics",
    "normal_wear": "property-condition classification",
    "new_damage": "property-condition classification",
    "deposit_wei": "financial settlement state",
    "deduction_wei": "financial settlement state",
    "emit_transfer": "value transfer surface",
    "@gl.public.write.payable": "payable write surface",
}

frontend_forbidden = {
    "move-in": "property-condition UI",
    "move-out": "property-condition UI",
    "normal wear": "property-condition UI",
    "new damage": "property-condition UI",
    "security deposit": "financial settlement UI",
}

problems = []
for term, reason in contract_forbidden.items():
    if term in CONTRACT:
        problems.append(f"contract contains {term!r}: {reason}")
for term, reason in frontend_forbidden.items():
    if term in FRONTEND:
        problems.append(f"frontend contains {term!r}: {reason}")

required = [
    "wearline_requirement_verifier",
    "acceptance_criterion",
    "evidence_guidance",
    "submit_evidence_package",
    "evidence_sufficient",
]
for term in required:
    if term not in CONTRACT:
        problems.append(f"contract missing required primitive term {term!r}")

if problems:
    print("Architecture-boundary check failed:")
    for problem in problems:
        print(f"- {problem}")
    sys.exit(1)

print("Architecture-boundary check passed.")
