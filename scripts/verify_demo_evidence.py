from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "demo" / "evidence"
MANIFEST = EVIDENCE / "manifest.json"


def main():
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    expected_files = set()
    for item in data["fixtures"]:
        path = EVIDENCE / item["file"]
        expected_files.add(item["file"])
        if not path.is_file():
            raise SystemExit(f"missing demo evidence: {item['file']}")
        body = path.read_bytes()
        digest = hashlib.sha256(body).hexdigest()
        if digest != item["sha256"]:
            raise SystemExit(f"sha256 mismatch for {item['file']}: {digest}")
        if len(body) != item["bytes"]:
            raise SystemExit(f"byte-length mismatch for {item['file']}: {len(body)}")

    actual_pngs = {path.name for path in EVIDENCE.glob("*.png")}
    if actual_pngs != expected_files:
        raise SystemExit(f"fixture set mismatch: expected {sorted(expected_files)}, got {sorted(actual_pngs)}")

    print(f"demo evidence verified: {len(expected_files)} fixtures")


if __name__ == "__main__":
    main()
