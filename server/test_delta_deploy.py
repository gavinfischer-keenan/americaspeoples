import hashlib
import json
import sys
import tarfile
import tempfile
import unittest
from io import BytesIO
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from deploy_remote_ct703 import apply_delta_release  # noqa: E402


def add_bytes(tar: tarfile.TarFile, name: str, data: bytes) -> None:
    ti = tarfile.TarInfo(name=name)
    ti.size = len(data)
    ti.mode = 0o644
    tar.addfile(ti, BytesIO(data))


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


class DeltaDeploySafety(unittest.TestCase):
    def test_delta_apply_unlinks_changed_files_and_keeps_rollback_immutable(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            api_root = root / "api"
            web_root = root / "web"
            prev_id = "20261125T000000Z-americas-v0.34.0"
            new_id = "20261125T010000Z-americas-v0.35.0"

            prev_api = api_root / "releases" / prev_id
            prev_web = web_root / "releases" / prev_id
            (prev_api / "data").mkdir(parents=True)
            (prev_api / "server").mkdir(parents=True)
            db_bytes = b"sqlite-fixture-db-bytes"
            (prev_api / "data/atlas.sqlite3").write_bytes(db_bytes)
            (prev_api / "server/app.py").write_bytes(b"print('prev')")

            old_app_js = b"console.log('0.34.0')"
            old_css = b"body{color:#111}"
            old_index = b"<script src='app.js?v=0.34.0'></script>"
            guide_css = b".guide{max-width:72ch}"
            unchanged_media = b"unchanged-webp-bytes"
            stale_dump = b"old-appendix-dump"

            (prev_web / "americaspeoples-app/sites/media").mkdir(parents=True)
            (prev_web / "spread-of-peoples/americas").mkdir(parents=True)
            (prev_web / "downloads/americaspeoples/v0.34.0").mkdir(parents=True)
            (prev_web / "other-site").mkdir(parents=True)

            (prev_web / "americaspeoples-app/app.js").write_bytes(old_app_js)
            (prev_web / "americaspeoples-app/app.css").write_bytes(old_css)
            (prev_web / "americaspeoples-app/index.html").write_bytes(old_index)
            (prev_web / "americaspeoples-app/sites/guide.css").write_bytes(guide_css)
            (prev_web / "americaspeoples-app/sites/media/pic.webp").write_bytes(unchanged_media)
            (prev_web / "americaspeoples-app/evidence-appendix.json").write_bytes(stale_dump)
            (prev_web / "spread-of-peoples/americas/about.html").write_bytes(b"preserved")
            (prev_web / "other-site/index.html").write_bytes(b"unrelated")

            new_app_js = b"console.log('0.35.0')"
            new_index = b"<script src='app.js?v=0.35.0'></script>"
            xlsx_bytes = b"xlsx-template"
            sums_bytes = f"{sha(xlsx_bytes)}  americas-peoples-import.xlsx\n".encode("utf-8")

            meta = {
                "id": new_id,
                "commit": "abc1234",
                "version": "0.35.0",
                "previousVersion": "0.34.0",
                "records": 11370,
                "rollbackApi": str(prev_api),
                "rollbackStatic": str(prev_web),
                "apiDbChanged": False,
                "webDeletePaths": ["americaspeoples-app/evidence-appendix.json"],
                "expectedSha256": {
                    "atlas.sqlite3": sha(db_bytes),
                    "app.js": sha(new_app_js),
                    "app.css": sha(old_css),
                    "index.html": sha(new_index),
                    "sites/guide.css": sha(guide_css),
                },
            }

            delta_tar = root / "delta.tar.gz"
            with tarfile.open(delta_tar, "w:gz") as tar:
                add_bytes(tar, "meta.json", json.dumps(meta).encode("utf-8"))
                add_bytes(tar, "api/server/app.py", b"print('new')")
                add_bytes(tar, "web/americaspeoples-app/app.js", new_app_js)
                add_bytes(tar, "web/americaspeoples-app/index.html", new_index)
                add_bytes(tar, "web/downloads-v0.35.0/americas-peoples-import.xlsx", xlsx_bytes)
                add_bytes(tar, "web/downloads-v0.35.0/SHA256SUMS.txt", sums_bytes)

            can_symlink = True
            probe = root / "_symlink_probe"
            try:
                probe.symlink_to(prev_web, target_is_directory=True)
                probe.unlink()
            except OSError:
                can_symlink = False

            res = apply_delta_release(
                delta_tar,
                api_root=api_root,
                web_root=web_root,
                health_url=None,
                restart_service=False,
                switch_symlinks=can_symlink,
            )
            self.assertEqual(res["writtenWebFiles"], 2)
            self.assertEqual(res["deletedWebPaths"], 1)
            self.assertFalse(res["apiDbChanged"])

            new_web = web_root / "releases" / new_id
            # Previous release stayed 100% untouched (changed, deleted, and unchanged files)
            self.assertEqual((prev_web / "americaspeoples-app/app.js").read_bytes(), old_app_js)
            self.assertTrue((prev_web / "americaspeoples-app/evidence-appendix.json").is_file())
            self.assertEqual((new_web / "americaspeoples-app/app.js").read_bytes(), new_app_js)
            self.assertEqual((new_web / "americaspeoples-app/sites/media/pic.webp").read_bytes(), unchanged_media)
            self.assertFalse((new_web / "americaspeoples-app/evidence-appendix.json").exists())
            self.assertEqual((new_web / "spread-of-peoples/americas/about.html").read_bytes(), b"preserved")
            self.assertEqual((new_web / "other-site/index.html").read_bytes(), b"unrelated")
            # Symlinks and DB hardlink verified (skip strict symlink check only if host denies symlinks)
            self.assertEqual((api_root / "backups" / f"{new_id}-previous.sqlite3").read_bytes(), db_bytes)
            self.assertTrue((api_root / "deployment-receipts" / f"{new_id}.json").is_file())


if __name__ == "__main__":
    unittest.main()
