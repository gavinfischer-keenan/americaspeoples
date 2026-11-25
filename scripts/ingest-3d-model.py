#!/usr/bin/env python3
"""Validate and ingest a glTF 2.0 binary (.glb) into data/site-3d/.

Example (after downloading John Toeppen's CC BY 4.0 Hovenweep Castle GLB
from Sketchfab model 38b0384cd9a64a93966f0debd5eabed3):

  python scripts/ingest-3d-model.py path/to/hovenweep_castle.glb \\
    --id hovenweep-castle-photogrammetry \\
    --guide hovenweep-castle \\
    --record g20-hove-castle-architecture \\
    --title "Hovenweep Castle — Ground Photogrammetry Survey" \\
    --classification observed-photogrammetry \\
    --creator "John Toeppen" \\
    --creator-url "https://sketchfab.com/toeppen" \\
    --capture-date "2017-10-23" \\
    --method "Structure-from-motion photogrammetry from 632 photographs." \\
    --source-page "https://sketchfab.com/3d-models/hovenweep-castle-utah-38b0384cd9a64a93966f0debd5eabed3" \\
    --license "CC BY 4.0" \\
    --license-url "https://creativecommons.org/licenses/by/4.0/"
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_3D_DIR = ROOT / "data" / "site-3d"
MANIFEST_PATH = SITE_3D_DIR.parent / "site-3d-models.json"
MAX_RECOMMENDED_BYTES = 15_000_000

VALID_CLASSIFICATIONS = {
    "observed-survey": "Observed survey · Remote sensing (not a reconstruction)",
    "observed-photogrammetry": "Observed photogrammetry (not a reconstruction)",
    "survey-derived-reconstruction": "Survey-derived reconstruction (interpreted geometry)",
    "interpretive-reconstruction": "Interpretive reconstruction",
}


def inspect_glb(path: Path) -> dict:
    raw = path.read_bytes()
    if len(raw) < 20:
        raise ValueError("File is too small to be a glTF 2.0 binary (.glb)")
    magic, version, total_len = struct.unpack_from("<III", raw, 0)
    if magic != 0x46546C67 or version != 2:
        raise ValueError(f"Expected glTF 2.0 binary header, got magic=0x{magic:08x} version={version}")
    if total_len != len(raw):
        raise ValueError(f"GLB length mismatch: header declares {total_len} bytes, file has {len(raw)}")

    json_len, json_type = struct.unpack_from("<II", raw, 12)
    if json_type != 0x4E4F534A:
        raise ValueError("First GLB chunk is not JSON")
    gltf = json.loads(raw[20 : 20 + json_len].decode("utf-8"))

    extensions_required = gltf.get("extensionsRequired", [])
    if "KHR_draco_mesh_compression" in extensions_required:
        print(
            "WARNING: This GLB requires KHR_draco_mesh_compression. "
            "Export/re-save as uncompressed glTF 2.0 (.glb) before bundling so the zero-dependency WebGL viewer can load it.",
            file=sys.stderr,
        )

    accessors = gltf.get("accessors", [])
    verts = 0
    tris = 0
    for mesh in gltf.get("meshes", []):
        for prim in mesh.get("primitives", []):
            pos_idx = prim.get("attributes", {}).get("POSITION")
            if pos_idx is not None and pos_idx < len(accessors):
                verts += int(accessors[pos_idx].get("count", 0))
            idx_acc = prim.get("indices")
            if idx_acc is not None and idx_acc < len(accessors):
                tris += int(accessors[idx_acc].get("count", 0)) // 3
            elif pos_idx is not None and pos_idx < len(accessors):
                tris += int(accessors[pos_idx].get("count", 0)) // 3

    return {
        "bytes": len(raw),
        "sha256": hashlib.sha256(raw).hexdigest(),
        "vertexCount": verts,
        "triangleCount": tris,
        "textureCount": len(gltf.get("images", [])),
        "extensionsRequired": extensions_required,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("input_glb", type=Path, help="Path to source .glb file")
    parser.add_argument("--id", required=True, help="Slug ID (a-z, 0-9, -)")
    parser.add_argument("--guide", action="append", required=True, help="Target site guide ID (repeatable)")
    parser.add_argument("--record", required=True, help="Linked evidence record ID")
    parser.add_argument("--title", required=True, help="Display title")
    parser.add_argument("--classification", required=True, choices=sorted(VALID_CLASSIFICATIONS))
    parser.add_argument("--creator", required=True, help="Survey/model creator")
    parser.add_argument("--creator-url", default="", help="Creator profile or institution URL")
    parser.add_argument("--capture-date", required=True, help="Capture date or year")
    parser.add_argument("--method", required=True, help="Capture/survey method description")
    parser.add_argument("--source-page", required=True, help="HTTPS source landing page URL")
    parser.add_argument("--license", required=True, help="License name (e.g. CC BY 4.0 or Public Domain)")
    parser.add_argument("--license-url", required=True, help="HTTPS license URL")
    parser.add_argument("--fallback-media", default="hovenweep-castle-habs-north", help="Fallback image ID in guide-media")
    parser.add_argument("--write-manifest", action="store_true", help="Insert or update entry in data/site-3d-models.json")
    args = parser.parse_args()

    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", args.id):
        raise SystemExit(f"Invalid --id slug: {args.id}")

    stats = inspect_glb(args.input_glb)
    if stats["bytes"] > MAX_RECOMMENDED_BYTES:
        raise SystemExit(
            f"GLB size {stats['bytes']} bytes exceeds {MAX_RECOMMENDED_BYTES} byte limit; decimate or resize textures first."
        )

    SITE_3D_DIR.mkdir(parents=True, exist_ok=True)
    dest = SITE_3D_DIR / f"{args.id}.glb"
    shutil.copy2(args.input_glb, dest)

    entry = {
        "id": args.id,
        "guideIds": args.guide,
        "siteRecordId": args.record,
        "title": args.title,
        "classification": args.classification,
        "classificationLabel": VALID_CLASSIFICATIONS[args.classification],
        "file": dest.name,
        "format": "glb",
        "bytes": stats["bytes"],
        "sha256": stats["sha256"],
        "vertexCount": stats["vertexCount"],
        "triangleCount": stats["triangleCount"],
        "scaleNote": "Inspect model scale and orientation notes against linked measured drawings.",
        "provenance": {
            "creator": args.creator,
            **({"creatorUrl": args.creator_url} if args.creator_url else {}),
            "captureDate": args.capture_date,
            "method": args.method,
            "revision": 1,
            "sourcePage": args.source_page,
            "citations": [{"title": args.title, "url": args.source_page}],
        },
        "license": {
            "name": args.license,
            "url": args.license_url,
            "evidence": f"Verified from source page {args.source_page}.",
            "projectLicenseApplies": False,
        },
        "fallback": {
            "mediaId": args.fallback_media,
            "alt": f"Static photograph fallback for {args.title}.",
            "summary": f"Static documentation photograph shown until the {round(stats['bytes']/1048576, 2)} MB 3D model is loaded on demand.",
            "spatialNotes": "Enable WebGL or inspect the linked measured drawings below.",
        },
        "camera": {"position": [0, 8, 18], "target": [0, 0, 0], "fovDeg": 42},
        "annotations": [],
    }

    if args.write_manifest:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        models = [m for m in manifest.get("models", []) if m.get("id") != args.id]
        models.append(entry)
        manifest["models"] = models
        MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"Updated {MANIFEST_PATH} with {args.id}")

    print(f"Copied {dest} ({stats['bytes']} bytes, {stats['triangleCount']} tris, sha256={stats['sha256']})")
    if not args.write_manifest:
        print(json.dumps(entry, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
