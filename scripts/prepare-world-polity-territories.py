#!/usr/bin/env python3
"""Extract curated Asian and African polity territory polygons from Cliopatria (CC BY 4.0)."""

from __future__ import annotations

import hashlib
import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARCHIVE = ROOT.parent / "pacific-research" / "cliopatria" / "cliopatria.geojson.zip"
EXPECTED_SHA256 = "e10a4e429fca708788ff9e7572a95fce801fae55852d217cffabc1c59cd4eed4"
PYTHON_LIBS = ROOT.parent / "pacific-research" / "python-libs"
OUT_PATH = ROOT / "data" / "world" / "regional-polity-territories.json"

sys.path.insert(0, str(PYTHON_LIBS))
from shapely.geometry import MultiPolygon, Polygon, mapping, shape  # type: ignore
from shapely.geometry.polygon import orient  # type: ignore

TARGETS: list[tuple[str, str, list[str], str]] = [
    ("ach", "Achaemenid Empire", ["africa", "asia-pacific"], "Achaemenid Empire"),
    ("mau", "Maurya Empire", ["asia-pacific"], "Maurya Empire"),
    ("han", "Han Dynasty", ["asia-pacific"], "Han Dynasty"),
    ("kus", "Kushan Empire", ["asia-pacific"], "Kushan Empire"),
    ("sas", "Sasanian Empire", ["asia-pacific", "africa"], "Sasanian Empire"),
    ("gup", "Gupta Empire", ["asia-pacific"], "Gupta Empire"),
    ("tan", "Tang Dynasty", ["asia-pacific"], "Tang Dynasty"),
    ("tib", "Tibetan Empire", ["asia-pacific"], "Tibetan Empire"),
    ("sri", "Srivijaya", ["asia-pacific"], "Srivijaya Maritime Polity"),
    ("khm", "Khmer Empire", ["asia-pacific"], "Khmer Empire"),
    ("cho", "Chola Empire", ["asia-pacific"], "Chola Empire"),
    ("nso", "Northern Song", ["asia-pacific"], "Northern Song Dynasty"),
    ("sso", "Southern Song", ["asia-pacific"], "Southern Song Dynasty"),
    ("gor", "Goryeo", ["asia-pacific"], "Goryeo Kingdom"),
    ("maj", "Majapahit", ["asia-pacific"], "Majapahit Empire"),
    ("mng", "Ming Dynasty", ["asia-pacific"], "Ming Dynasty"),
    ("jos", "Joseon", ["asia-pacific"], "Joseon Dynasty"),
    ("mug", "Mughal Empire", ["asia-pacific"], "Mughal Empire"),
    ("saf", "Safavid Dynasty", ["asia-pacific"], "Safavid Dynasty"),
    ("ott", "Ottoman Empire", ["africa", "asia-pacific", "europe"], "Ottoman Empire"),
    ("tok", "Tokugawa Shogunate", ["asia-pacific"], "Tokugawa Shogunate"),
    ("qng", "Qing Dynasty", ["asia-pacific"], "Qing Dynasty"),
    ("ksh", "Kingdom of Kush", ["africa"], "Kingdom of Kush"),
    ("axm", "Kingdom of Axum", ["africa"], "Kingdom of Aksum"),
    ("uma", "Umayyad Caliphate", ["africa", "asia-pacific"], "Umayyad Caliphate"),
    ("abb", "Abbasid Caliphate", ["africa", "asia-pacific"], "Abbasid Caliphate"),
    ("fat", "Fatimid Caliphate", ["africa"], "Fatimid Caliphate"),
    ("kan", "Empire of Kanem", ["africa"], "Kanem Empire"),
    ("mal", "Mali Empire", ["africa"], "Mali Empire"),
    ("mam", "Mamluk Sultanate", ["africa"], "Mamluk Sultanate"),
    ("eth", "Ethiopian Empire", ["africa"], "Ethiopian Empire"),
    ("bor", "Bornu Empire", ["africa"], "Bornu Empire"),
    ("kon", "Kingdom of Kongo", ["africa"], "Kingdom of Kongo"),
    ("son", "Songhai Empire", ["africa"], "Songhai Empire"),
    ("oyo", "Oyo Empire", ["africa"], "Oyo Empire"),
    ("ash", "Ashanti Empire", ["africa"], "Asante (Ashanti) Empire"),
    ("zul", "Zululand", ["africa"], "Zulu Kingdom (KwaZulu)"),
]


def astro_year(signed_year: int) -> int:
    return signed_year + 1 if signed_year < 0 else signed_year


def fmt_year(yr: int) -> str:
    return f"{1 - yr} BCE" if yr <= 0 else f"{yr} CE"


def clean_ring(coords) -> list[list[float]] | None:
    pts = [[round(max(-180.0, min(180.0, float(x))), 4), round(max(-89.9, min(89.9, float(y))), 4)] for x, y in coords]
    dedup: list[list[float]] = []
    for p in pts:
        if not dedup or p != dedup[-1]:
            dedup.append(p)
    if len(dedup) < 3:
        return None
    if dedup[0] != dedup[-1]:
        dedup.append(list(dedup[0]))
    return dedup if len(dedup) >= 4 else None


def clean_geometry(raw_geom) -> dict | None:
    geom = shape(raw_geom)
    if not geom.is_valid:
        geom = geom.buffer(0)
    if geom.is_empty:
        return None
    simplified = geom.simplify(0.08, preserve_topology=True)
    if simplified.is_empty:
        simplified = geom.simplify(0.02, preserve_topology=True)
    if not simplified.is_valid:
        simplified = simplified.buffer(0)
    parts = [simplified] if isinstance(simplified, Polygon) else (list(simplified.geoms) if isinstance(simplified, MultiPolygon) else [])
    polys: list[list[list[list[float]]]] = []
    for part in parts:
        if not isinstance(part, Polygon) or part.is_empty or part.area < 0.03:
            continue
        oriented = orient(part, sign=-1.0)
        ext = clean_ring(oriented.exterior.coords)
        if not ext:
            continue
        rings = [ext]
        for interior in oriented.interiors:
            hole = clean_ring(interior.coords)
            if hole:
                rings.append(hole)
        polys.append(rings)
    if not polys:
        return None
    if len(polys) == 1:
        return {"type": "Polygon", "coordinates": polys[0]}
    return {"type": "MultiPolygon", "coordinates": polys}


def pick_snapshots(rows: list[dict]) -> list[dict]:
    max_area = max(r["area"] for r in rows)
    substantial = [r for r in rows if r["area"] >= 0.45 * max_area] or rows
    primary = max(substantial, key=lambda r: (r["dur"], r["area"]))
    picked = [primary]

    disjoint = [r for r in rows if r["end"] < primary["start"] or r["start"] > primary["end"]]
    if disjoint:
        if primary["area"] < 0.85 * max_area:
            peak_cands = [r for r in disjoint if r["area"] >= 0.85 * max_area]
            if peak_cands:
                secondary = max(peak_cands, key=lambda r: (1 if r["dur"] >= 5 else 0, r["area"], r["dur"]))
                picked.append(secondary)
        elif primary["dur"] < 40:
            large_disjoint = [r for r in disjoint if r["area"] >= 0.55 * max_area]
            if large_disjoint:
                secondary = max(large_disjoint, key=lambda r: (r["dur"], r["area"]))
                picked.append(secondary)

    horizon = [r for r in rows if r["end"] == 1900 and all(r["end"] < p["start"] or r["start"] > p["end"] for p in picked)]
    if horizon:
        picked.append(max(horizon, key=lambda r: (r["dur"], r["area"])))

    picked.sort(key=lambda r: r["start"])
    return picked


def main() -> None:
    if not ARCHIVE.exists():
        raise FileNotFoundError(f"Missing Cliopatria archive: {ARCHIVE}")
    digest = hashlib.sha256(ARCHIVE.read_bytes()).hexdigest()
    if digest != EXPECTED_SHA256:
        raise RuntimeError(f"Cliopatria SHA-256 mismatch: {digest} != {EXPECTED_SHA256}")

    with zipfile.ZipFile(ARCHIVE) as zf:
        geojson_name = next(n for n in zf.namelist() if n.endswith(".geojson"))
        fc = json.loads(zf.read(geojson_name))

    target_names = {nm for _, nm, _, _ in TARGETS}
    by_name: dict[str, list[dict]] = {}
    for idx, feat in enumerate(fc["features"]):
        props = feat.get("properties", {})
        nm = props.get("Name")
        if nm not in target_names:
            continue
        raw_from = int(props["FromYear"])
        raw_to = int(props["ToYear"])
        if raw_from > 1900:
            continue
        start = astro_year(raw_from)
        end = min(astro_year(raw_to), 1900)
        if end < start:
            continue
        geom = feat.get("geometry")
        if not geom:
            continue
        by_name.setdefault(nm, []).append(
            {
                "idx": idx,
                "name": nm,
                "raw_from": raw_from,
                "raw_to": raw_to,
                "start": start,
                "end": end,
                "dur": end - start + 1,
                "area": shape(geom).area,
                "geometry": geom,
            }
        )

    territories = []
    for slug, clio_name, region_ids, display_name in TARGETS:
        rows = by_name.get(clio_name, [])
        if not rows:
            raise RuntimeError(f"No Cliopatria rows under <= 1900 CE for {clio_name}")
        for chosen in pick_snapshots(rows):
            cleaned = clean_geometry(chosen["geometry"])
            if not cleaned:
                continue
            territories.append(
                {
                    "id": f"polity-{slug}-{chosen['idx']}",
                    "title": f"{display_name} ({fmt_year(chosen['start'])}–{fmt_year(chosen['end'])})",
                    "start": chosen["start"],
                    "end": chosen["end"],
                    "geometry": cleaned,
                    "meaning": "approximate-control",
                    "limits": (
                        f"Cliopatria row {chosen['idx']}, {clio_name}, original signed BCE/CE window "
                        f"{chosen['raw_from']} to {chosen['raw_to']} (capped at 1900 CE for timeline compatibility). "
                        "Approximate historical-atlas polity reconstruction, not surveyed sovereignty or continuous borders. "
                        "Simplified at 0.08 degrees (0.02 fallback) and rounded to 4 decimals; rings oriented for D3. "
                        "CC BY 4.0 source and derivative: Bennett et al. / Seshat, https://creativecommons.org/licenses/by/4.0/."
                    ),
                    "sourceIds": ["polity-cliopatria", "polity-cliopatria-methods"],
                    "regionIds": region_ids,
                }
            )

    payload = {
        "schemaVersion": 1,
        "sources": [
            {
                "id": "polity-cliopatria",
                "title": "Bennett et al. / Seshat (2025), Cliopatria historical polity geometry",
                "url": "https://github.com/Seshat-Global-History-Databank/cliopatria/tree/5f433377139a6eeaeacbdc894b70f8805b72c8b5",
                "access": (
                    "Pinned archive checked locally; CC BY 4.0: https://creativecommons.org/licenses/by/4.0/. "
                    "Curated Asian and African state snapshots simplified at 0.08 degrees and oriented for D3."
                ),
                "locator": f"Archive SHA-256 {EXPECTED_SHA256}; row indices and signed year windows recorded per polygon.",
            },
            {
                "id": "polity-cliopatria-methods",
                "title": "Bennett et al. (2025), Cliopatria: a geospatial database of world-wide political entities",
                "url": "https://doi.org/10.1038/s41597-025-04516-9",
                "access": "Official repository metadata and README checked; historical-atlas boundaries have uneven temporal resolution.",
                "locator": "Scientific Data 12, 247. Dataset signed BCE years converted to astronomical years (+1).",
            },
        ],
        "taxa": [],
        "evidence": [],
        "waves": [],
        "territories": territories,
    }

    OUT_PATH.write_text(json.dumps(payload, separators=(",", ":"), ensure_ascii=False) + "\n", encoding="utf-8")
    size_kb = OUT_PATH.stat().st_size / 1024
    print(f"Wrote {len(territories)} territory snapshots across {len(TARGETS)} polities ({size_kb:.1f} KB) to {OUT_PATH}")


if __name__ == "__main__":
    main()
