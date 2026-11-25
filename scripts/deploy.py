"""Deploy Americas Peoples static + API release to webserver CT 703 via manifest-diff delta."""

import argparse
import hashlib
import json
import os
import sqlite3
import subprocess
import tarfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REMOTE_SCRIPT = ROOT / "scripts/deploy_remote_ct703.py"
EXCLUDED_WEB_DUMPS = {
    "dataset.json",
    "evidence-appendix.json",
    "evidence-appendix.html",
}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def collect_local_web_files(dist_dir: Path) -> dict[str, Path]:
    files: dict[str, Path] = {}
    for cur, dirs, names in os.walk(dist_dir):
        cur_p = Path(cur)
        if cur_p == dist_dir and "tripofisch-site" in dirs:
            dirs.remove("tripofisch-site")
        rel_dir = cur_p.relative_to(dist_dir)
        for name in sorted(names):
            rel = f"{rel_dir.as_posix()}/{name}" if str(rel_dir) != "." else name
            if rel in EXCLUDED_WEB_DUMPS:
                continue
            files[f"americaspeoples-app/{rel}"] = cur_p / name

    spread_dir = dist_dir / "tripofisch-site/spread-of-peoples"
    for cur, _, names in os.walk(spread_dir):
        cur_p = Path(cur)
        rel_dir = cur_p.relative_to(spread_dir)
        for name in sorted(names):
            rel = f"{rel_dir.as_posix()}/{name}" if str(rel_dir) != "." else name
            files[f"spread-of-peoples/{rel}"] = cur_p / name
    return files


def add_tar_file(tar: tarfile.TarFile, src: Path, arcname: str) -> None:
    ti = tar.gettarinfo(str(src), arcname=arcname)
    ti.uid = 0
    ti.gid = 0
    ti.uname = "root"
    ti.gname = "root"
    ti.mode = 0o644
    with src.open("rb") as f:
        tar.addfile(ti, f)


def add_tar_bytes(tar: tarfile.TarFile, data: bytes, arcname: str) -> None:
    import io

    ti = tarfile.TarInfo(name=arcname)
    ti.size = len(data)
    ti.mode = 0o644
    ti.uid = 0
    ti.gid = 0
    tar.addfile(ti, io.BytesIO(data))


def run(cmd: list[str], capture: bool = False) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, check=True, text=True, capture_output=capture)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="webserver", help="Proxmox SSH host")
    parser.add_argument("--ctid", default="703", help="Container ID on host")
    parser.add_argument("--dry-run", action="store_true", help="Compute delta manifest without uploading")
    args = parser.parse_args()

    pkg = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    version = pkg["version"]
    commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()

    dist_dir = ROOT / "dist"
    index_html = (dist_dir / "index.html").read_text(encoding="utf-8")
    assert f"app.js?v={version}" in index_html, f"dist/index.html missing app.js?v={version}"
    assert f"app.css?v={version}" in index_html, f"dist/index.html missing app.css?v={version}"

    db_path = ROOT / "release/atlas.sqlite3"
    assert db_path.is_file(), "Missing release/atlas.sqlite3; run npm run build first."
    with sqlite3.connect(db_path) as db:
        assert db.execute("PRAGMA integrity_check").fetchone()[0] == "ok", "SQLite integrity check failed"
        record_count = db.execute("SELECT COUNT(*) FROM records").fetchone()[0]
        meta_json = json.loads(db.execute("SELECT value FROM metadata WHERE key='manifest'").fetchone()[0])
        assert meta_json["version"] == version, f"SQLite version {meta_json['version']} != {version}"

    # 1. Push remote helper and inspect live manifest
    run(["scp", str(REMOTE_SCRIPT), f"{args.host}:/var/tmp/deploy_remote_ct703.py"])
    run(["ssh", args.host, f"pct push {args.ctid} /var/tmp/deploy_remote_ct703.py /var/tmp/deploy_remote_ct703.py"])
    manifest_proc = run(["ssh", args.host, f"pct exec {args.ctid} -- python3 /var/tmp/deploy_remote_ct703.py --manifest"], capture=True)
    remote = json.loads(manifest_proc.stdout)
    prev_version = remote["health"]["version"]
    assert prev_version != version, f"Remote is already at version {version}; bump package.json before deploying."

    # 2. Compute file delta against current CT 703 release
    local_web = collect_local_web_files(dist_dir)
    remote_files: dict[str, str] = remote["files"]

    changed_web: list[tuple[str, Path]] = []
    unchanged_count = 0
    for rel, path in sorted(local_web.items()):
        lsha = sha256_file(path)
        if remote_files.get(rel) == lsha:
            unchanged_count += 1
        else:
            changed_web.append((rel, path))

    # Do not delete preserved Tripofisch compatibility pages like spread-of-peoples/americas/about.html
    preserved_remote = {"spread-of-peoples/americas/about.html"}
    delete_web = sorted(rel for rel in remote_files if rel not in local_web and rel not in preserved_remote)

    db_sha = sha256_file(db_path)
    api_db_changed = remote.get("dbSha256") != db_sha

    rel_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ") + f"-americas-v{version}"
    meta = {
        "id": rel_id,
        "commit": commit,
        "version": version,
        "previousVersion": prev_version,
        "records": record_count,
        "rollbackApi": remote["currentApi"],
        "rollbackStatic": remote["currentStatic"],
        "apiDbChanged": api_db_changed,
        "webDeletePaths": delete_web,
        "expectedSha256": {
            "atlas.sqlite3": db_sha,
            "app.js": sha256_file(dist_dir / "app.js"),
            "app.css": sha256_file(dist_dir / "app.css"),
            "index.html": sha256_file(dist_dir / "index.html"),
            "sites/guide.css": sha256_file(dist_dir / "sites/guide.css"),
        },
    }

    delta_tar = ROOT / "release" / f"americas-v{version}-delta.tar.gz"
    delta_tar.parent.mkdir(parents=True, exist_ok=True)
    with tarfile.open(delta_tar, "w:gz") as tar:
        add_tar_bytes(tar, (json.dumps(meta, indent=2) + "\n").encode("utf-8"), "meta.json")
        for sname in ("app.py", "database.py", "release_retention.py"):
            add_tar_file(tar, ROOT / "server" / sname, f"api/server/{sname}")
        if api_db_changed:
            add_tar_file(tar, db_path, "api/data/atlas.sqlite3")
        for rel, path in changed_web:
            add_tar_file(tar, path, f"web/{rel}")
        for src, dst_name in (
            (ROOT / "templates/americas-peoples-import.xlsx", "americas-peoples-import.xlsx"),
            (ROOT / "release/artifacts.json", "artifacts.json"),
            (ROOT / "release/SHA256SUMS.txt", "SHA256SUMS.txt"),
        ):
            add_tar_file(tar, src, f"web/downloads-v{version}/{dst_name}")

    plan_summary = {
        "id": rel_id,
        "fromVersion": prev_version,
        "toVersion": version,
        "deltaTarBytes": delta_tar.stat().st_size,
        "uploadedWebFiles": len(changed_web),
        "hardlinkedWebFiles": unchanged_count,
        "deletedWebPaths": len(delete_web),
        "apiDbChanged": api_db_changed,
    }
    print(json.dumps(plan_summary, indent=2))

    if args.dry_run:
        return

    remote_tar = f"/var/tmp/americas-v{version}-delta.tar.gz"
    try:
        run(["scp", str(delta_tar), f"{args.host}:{remote_tar}"])
        run(["ssh", args.host, f"pct push {args.ctid} {remote_tar} {remote_tar}"])
        apply_proc = run(
            ["ssh", args.host, f"pct exec {args.ctid} -- python3 /var/tmp/deploy_remote_ct703.py --apply {remote_tar}"],
            capture=True,
        )
        print(apply_proc.stdout)
    finally:
        delta_tar.unlink(missing_ok=True)
        subprocess.run(
            ["ssh", args.host, f"rm -f {remote_tar} /var/tmp/deploy_remote_ct703.py && pct exec {args.ctid} -- rm -f {remote_tar} /var/tmp/deploy_remote_ct703.py"],
            check=False,
        )


if __name__ == "__main__":
    main()
