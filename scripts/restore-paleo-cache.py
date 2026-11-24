"""Restore and verify the paleoclimate download cache in data/physical-sources/paleo/.

The cache is committed, so a normal checkout already has it. Use this script to
check it against data/physical-sources/paleoclimate-manifest.json (SHA-256 and
size per file), or to re-download any missing or damaged file from its recorded
source URL. Exits non-zero if any file cannot be restored to the recorded bytes.

    python3 scripts/restore-paleo-cache.py           # verify, download only missing/bad files
    python3 scripts/restore-paleo-cache.py --verify  # verify only, never download
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "data" / "physical-sources"
MANIFEST = SOURCES / "paleoclimate-manifest.json"
UA = "Mozilla/5.0 (compatible; AmericasPeoples-PaleoFetcher/1.0)"


def entries() -> list[dict]:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return data
    return next(v for v in data.values() if isinstance(v, list))


def matches(raw: bytes, entry: dict) -> bool:
    return len(raw) == entry["bytes"] and hashlib.sha256(raw).hexdigest() == entry["sha256"]


def download(url: str) -> bytes:
    for attempt in range(4):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(request, timeout=120) as response:
                return response.read()
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2 * (attempt + 1))
    raise AssertionError("unreachable")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--verify", action="store_true", help="check only; do not download")
    args = parser.parse_args()
    failures: list[str] = []
    restored = 0
    items = entries()
    for entry in items:
        path = SOURCES / entry["file"]
        if path.exists() and matches(path.read_bytes(), entry):
            continue
        if args.verify:
            failures.append(f"{entry['file']}: missing or does not match manifest")
            continue
        try:
            raw = download(entry["url"])
        except Exception as error:  # noqa: BLE001 - report every failed file
            failures.append(f"{entry['file']}: download failed ({error})")
            continue
        if not matches(raw, entry):
            failures.append(f"{entry['file']}: source changed since it was recorded (hash or size differs)")
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(raw)
        restored += 1
    print(f"{len(items) - len(failures)} of {len(items)} paleoclimate source files verified; {restored} restored.")
    for failure in failures:
        print("  " + failure, file=sys.stderr)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
