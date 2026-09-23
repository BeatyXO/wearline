from pathlib import Path
import hashlib
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "contracts" / "Wearline.py"


def run(*args):
    print("+", " ".join(args))
    subprocess.run(args, cwd=ROOT, check=True)


run(sys.executable, "-m", "py_compile", "contracts/Wearline.py", "tests/direct_mode_suite.py", "tests/test_source_invariants.py")
run(sys.executable, "-m", "unittest", "tests/test_source_invariants.py", "-v")
run(sys.executable, "scripts/check_stale_terms.py")

root_env = (ROOT / ".env.example").read_text(encoding="utf-8").strip()
front_env = (ROOT / "frontend" / ".env.example").read_text(encoding="utf-8").strip()
if root_env != front_env:
    raise SystemExit("env examples differ")
contract_bytes = CONTRACT.read_bytes()
print("contract_sha256=", hashlib.sha256(contract_bytes).hexdigest(), sep="")
print("source-only preflight passed")
