"""Remote installer executed inside CT 703 for manifest inspection and delta deployment."""

import argparse
try:
    import fcntl
except ImportError:  # Windows test hosts lack fcntl; CT 703 Linux provides it.
    fcntl = None
import hashlib
import json
import os
import shutil
import subprocess
import tarfile
import time
import urllib.request
from pathlib import Path

LOCK_PATH = Path("/run/lock/americas-atlas-deploy.lock")
API_ROOT = Path("/srv/americaspeoples")
WEB_ROOT = Path("/srv/tripofisch")
HEALTH_URL = "http://127.0.0.1:8105/api/health"


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def collect_manifest(api_root: Path = API_ROOT, web_root: Path = WEB_ROOT, health_url: str | None = HEALTH_URL) -> dict:
    current_api = (api_root / "current").resolve()
    current_web = (web_root / "current").resolve()
    files: dict[str, str] = {}
    for top in ("americaspeoples-app", "spread-of-peoples"):
        base = current_web / top
        if not base.is_dir():
            continue
        for cur, _, names in os.walk(base):
            cur_p = Path(cur)
            for name in names:
                fp = cur_p / name
                if fp.is_file():
                    rel = fp.relative_to(current_web).as_posix()
                    files[rel] = sha256_file(fp)

    db_path = current_api / "data/atlas.sqlite3"
    db_sha = sha256_file(db_path) if db_path.is_file() else ""
    health = None
    if health_url:
        with urllib.request.urlopen(health_url, timeout=5) as resp:
            health = json.loads(resp.read().decode("utf-8"))

    return {
        "currentApi": str(current_api),
        "currentStatic": str(current_web),
        "dbSha256": db_sha,
        "health": health,
        "files": files,
    }


def clone_hardlink_tree(src: Path, dst: Path) -> None:
    dst.mkdir(parents=True, exist_ok=True)
    for cur, dirs, files in os.walk(src):
        cur_p = Path(cur)
        rel = cur_p.relative_to(src)
        target_dir = dst / rel if str(rel) != "." else dst
        for d in dirs:
            (target_dir / d).mkdir(exist_ok=True)
        for name in files:
            src_f = cur_p / name
            dst_f = target_dir / name
            if src_f.is_symlink():
                dst_f.symlink_to(os.readlink(src_f))
            else:
                os.link(src_f, dst_f)


def chmod_tree(root: Path, dir_mode: int = 0o755, file_mode: int = 0o644) -> None:
    if not root.exists():
        return
    os.chmod(root, dir_mode)
    for cur, dirs, files in os.walk(root):
        cur_p = Path(cur)
        for d in dirs:
            os.chmod(cur_p / d, dir_mode)
        for fn in files:
            fp = cur_p / fn
            if not fp.is_symlink():
                os.chmod(fp, file_mode)


def ensure_writable_parent(path: Path, stop_at: Path) -> None:
    ancestors = []
    cur = path.parent
    while cur != stop_at and cur != cur.parent:
        ancestors.append(cur)
        cur = cur.parent
    os.chmod(stop_at, 0o755)
    for anc in reversed(ancestors):
        anc.mkdir(exist_ok=True)
        os.chmod(anc, 0o755)


def atomic_symlink(target: Path, link_path: Path) -> None:
    tmp_link = link_path.with_name(f".{link_path.name}.tmp-{os.getpid()}")
    if tmp_link.exists() or tmp_link.is_symlink():
        tmp_link.unlink()
    tmp_link.symlink_to(target)
    os.replace(tmp_link, link_path)


def verify_sha256sums(dl_dir: Path) -> None:
    sums_file = dl_dir / "SHA256SUMS.txt"
    assert sums_file.is_file(), f"Missing {sums_file}"
    for line in sums_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        expected_sha, filename = line.split(None, 1)
        filename = filename.strip()
        target = dl_dir / filename
        assert target.is_file(), f"Missing download artifact listed in SHA256SUMS.txt: {filename}"
        actual_sha = sha256_file(target)
        assert actual_sha == expected_sha, f"Checksum mismatch for {filename}: {actual_sha} != {expected_sha}"


def apply_delta_release(
    delta_tar: Path,
    api_root: Path = API_ROOT,
    web_root: Path = WEB_ROOT,
    health_url: str | None = HEALTH_URL,
    restart_service: bool = True,
    switch_symlinks: bool = True,
) -> dict:
    assert delta_tar.is_file(), f"Missing delta archive: {delta_tar}"

    with tarfile.open(delta_tar, "r:gz") as tar:
        meta = json.load(tar.extractfile(tar.getmember("meta.json")))

        rel_id = meta["id"]
        commit = meta["commit"]
        version = meta["version"]
        prev_version = meta["previousVersion"]
        prev_api = Path(meta["rollbackApi"])
        prev_static = Path(meta["rollbackStatic"])
        expected = meta["expectedSha256"]
        records_count = meta["records"]
        api_db_changed = bool(meta["apiDbChanged"])
        web_delete_paths = list(meta.get("webDeletePaths", []))

        assert prev_api.is_dir(), f"Missing rollback API dir: {prev_api}"
        assert prev_static.is_dir(), f"Missing rollback static dir: {prev_static}"

        new_api = api_root / "releases" / rel_id
        new_static = web_root / "releases" / rel_id
        backups_dir = api_root / "backups"
        receipts_dir = api_root / "deployment-receipts"
        backup_db = backups_dir / f"{rel_id}-previous.sqlite3"
        receipt_path = receipts_dir / f"{rel_id}.json"

        assert not new_api.exists(), f"Target API release already exists: {new_api}"
        assert not new_static.exists(), f"Target static release already exists: {new_static}"

        # 1. Back up previous DB (actual copy, never hardlink)
        backups_dir.mkdir(parents=True, exist_ok=True)
        prev_db = prev_api / "data/atlas.sqlite3"
        shutil.copy2(prev_db, backup_db)
        os.chmod(backup_db, 0o644)
        assert sha256_file(backup_db) == sha256_file(prev_db), "Previous DB backup SHA mismatch"

        # 2. Build API release
        new_api.mkdir(parents=True, exist_ok=False)
        for member in tar.getmembers():
            if not member.isfile():
                continue
            if member.name.startswith("api/server/"):
                dest = new_api / Path(member.name).relative_to("api")
                dest.parent.mkdir(parents=True, exist_ok=True)
                with tar.extractfile(member) as src, dest.open("wb") as dst:
                    shutil.copyfileobj(src, dst)
            elif member.name == "api/data/atlas.sqlite3" and api_db_changed:
                dest = new_api / "data/atlas.sqlite3"
                dest.parent.mkdir(parents=True, exist_ok=True)
                with tar.extractfile(member) as src, dest.open("wb") as dst:
                    shutil.copyfileobj(src, dst)

        target_db = new_api / "data/atlas.sqlite3"
        if not api_db_changed:
            target_db.parent.mkdir(parents=True, exist_ok=True)
            os.link(prev_db, target_db)
        chmod_tree(new_api)
        assert sha256_file(target_db) == expected["atlas.sqlite3"], "API DB SHA mismatch"

        # 3. Hardlink clone previous static tree, then unlink removed & updated paths
        clone_hardlink_tree(prev_static, new_static)
        os.chmod(new_static, 0o755)
        for rel_del in web_delete_paths:
            victim = new_static / rel_del
            if victim.exists() or victim.is_symlink():
                ensure_writable_parent(victim, new_static)
                victim.unlink()

        dl_dir = new_static / "downloads/americaspeoples" / f"v{version}"
        ensure_writable_parent(dl_dir / "placeholder", new_static)
        if dl_dir.exists():
            shutil.rmtree(dl_dir)
        dl_dir.mkdir(parents=True, exist_ok=True)

        written_files = 0
        for member in tar.getmembers():
            if not member.isfile():
                continue
            if member.name.startswith("web/americaspeoples-app/") or member.name.startswith("web/spread-of-peoples/"):
                rel_web = Path(member.name).relative_to("web")
                dest = new_static / rel_web
                ensure_writable_parent(dest, new_static)
                if dest.exists() or dest.is_symlink():
                    dest.unlink()
                with tar.extractfile(member) as src, dest.open("wb") as dst:
                    shutil.copyfileobj(src, dst)
                os.chmod(dest, 0o644)
                written_files += 1
            elif member.name.startswith(f"web/downloads-v{version}/"):
                rel_dl = Path(member.name).relative_to(f"web/downloads-v{version}")
                dest = dl_dir / rel_dl
                dest.parent.mkdir(parents=True, exist_ok=True)
                with tar.extractfile(member) as src, dest.open("wb") as dst:
                    shutil.copyfileobj(src, dst)
                os.chmod(dest, 0o644)

        # Clean up empty dirs under americaspeoples-app or spread-of-peoples after deletions
        for top in ("americaspeoples-app", "spread-of-peoples"):
            top_dir = new_static / top
            if top_dir.is_dir():
                for cur, dirs, files in os.walk(top_dir, topdown=False):
                    cur_p = Path(cur)
                    if cur_p != top_dir and not any(cur_p.iterdir()):
                        cur_p.rmdir()

        chmod_tree(new_static / "americaspeoples-app")
        chmod_tree(new_static / "spread-of-peoples")
        chmod_tree(dl_dir)

        app_dir = new_static / "americaspeoples-app"
        assert sha256_file(app_dir / "app.js") == expected["app.js"], "app.js SHA mismatch"
        assert sha256_file(app_dir / "app.css") == expected["app.css"], "app.css SHA mismatch"
        assert sha256_file(app_dir / "index.html") == expected["index.html"], "index.html SHA mismatch"
        assert sha256_file(app_dir / "sites/guide.css") == expected["sites/guide.css"], "sites/guide.css SHA mismatch"
        verify_sha256sums(dl_dir)

        # 4. Atomic symlink switch and restart ONLY americas-atlas.service
        if switch_symlinks:
            atomic_symlink(new_api, api_root / "current")
            atomic_symlink(new_static, web_root / "current")

        if restart_service:
            subprocess.run(["systemctl", "restart", "americas-atlas.service"], check=True)
            subprocess.run(["systemctl", "is-active", "--quiet", "americas-atlas.service"], check=True)

        health = {"status": "ok", "version": version, "records": records_count}
        if health_url:
            observed = None
            for _ in range(40):
                try:
                    with urllib.request.urlopen(health_url, timeout=2) as resp:
                        observed = json.loads(resp.read().decode("utf-8"))
                        if observed.get("version") == version:
                            break
                except Exception:
                    time.sleep(0.25)
            assert observed == health, f"Health mismatch: {observed} != {health}"

        receipts_dir.mkdir(parents=True, exist_ok=True)
        receipt = {
            "status": "deployed",
            "id": rel_id,
            "commit": commit,
            "health": health,
            "static": str(new_static),
            "api": str(new_api),
            "previousVersion": prev_version,
            "rollbackStatic": str(prev_static),
            "rollbackApi": str(prev_api),
        }
        receipt_path.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
        os.chmod(receipt_path, 0o644)

        return {
            "deployed": receipt,
            "backup": str(backup_db),
            "receiptPath": str(receipt_path),
            "writtenWebFiles": written_files,
            "deletedWebPaths": len(web_delete_paths),
            "apiDbChanged": api_db_changed,
            "rollbackApiIntact": (prev_api / "data/atlas.sqlite3").is_file(),
            "rollbackStaticIntact": (prev_static / "americaspeoples-app/app.js").is_file(),
        }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--manifest", action="store_true", help="Print JSON manifest of live release")
    mode.add_argument("--apply", type=Path, help="Apply delta tar.gz release")
    args = parser.parse_args()

    if args.manifest:
        print(json.dumps(collect_manifest()))
        return

    LOCK_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOCK_PATH.open("w") as lock_file:
        if fcntl is not None:
            fcntl.flock(lock_file, fcntl.LOCK_EX)
        result = apply_delta_release(args.apply)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
