"""Download, verify, and compile peer-reviewed paleoclimate time series (7 Ma–1900 CE)
and CC-BY Quaternary/deglacial ice-sheet slices into data/paleoclimate-series.json
and data/global-ice-sheets.json.

All raw downloads are cached under data/physical-sources/paleo/ with SHA-256
checksums recorded in data/physical-sources/paleoclimate-manifest.json.
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import math
import re
import struct
import time
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
CACHE_DIR = ROOT / "data" / "physical-sources" / "paleo"
CACHE_DIR.mkdir(parents=True, exist_ok=True)
MANIFEST_PATH = ROOT / "data" / "physical-sources" / "paleoclimate-manifest.json"
SERIES_OUT = ROOT / "data" / "paleoclimate-series.json"
ICE_OUT = ROOT / "data" / "global-ice-sheets.json"

UA = "Mozilla/5.0 (compatible; AmericasPeoples-PaleoFetcher/1.0)"
manifest: list[dict] = []


def fetch_cached(rel_name: str, url: str, license_note: str, doi: str) -> bytes:
    path = CACHE_DIR / rel_name
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        print(f"Downloading {rel_name} ...", flush=True)
        for attempt in range(4):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=60) as resp:
                    data = resp.read()
                path.write_bytes(data)
                break
            except Exception as exc:
                if attempt == 3:
                    raise
                print(f"  Retry {attempt + 1} for {rel_name}: {exc}", flush=True)
                time.sleep(2 * (attempt + 1))
    raw = path.read_bytes()
    manifest.append(
        {
            "file": f"paleo/{rel_name}",
            "url": url,
            "doi": doi,
            "license": license_note,
            "retrieved": "2026-11-21",
            "bytes": len(raw),
            "sha256": hashlib.sha256(raw).hexdigest(),
        }
    )
    return raw


def downsample_extrema(rows: list[dict], target: int, value_key: str) -> list[dict]:
    """Downsample chronologically ordered rows while preserving local extrema in each bin."""
    if len(rows) <= target:
        return rows
    bins = max(2, target // 2)
    step = len(rows) / bins
    picked: list[int] = [0]
    for b in range(bins):
        lo = int(round(b * step))
        hi = min(len(rows), int(round((b + 1) * step)))
        if lo >= hi:
            continue
        seg = range(lo, hi)
        i_min = min(seg, key=lambda i: rows[i][value_key])
        i_max = max(seg, key=lambda i: rows[i][value_key])
        for idx in sorted({i_min, i_max}):
            if idx != picked[-1]:
                picked.append(idx)
    if picked[-1] != len(rows) - 1:
        picked.append(len(rows) - 1)
    return [rows[i] for i in picked]


def parse_miller2020() -> list[dict]:
    raw = fetch_cached(
        "miller2020rsl-sm-noaa.txt",
        "https://www.ncei.noaa.gov/pub/data/paleo/contributions_by_author/miller2020/miller2020rsl-sm-noaa.txt",
        "NOAA NCEI Public archive; DOI 10.1126/sciadv.aaz1346",
        "10.1126/sciadv.aaz1346",
    ).decode("utf-8", errors="replace")
    rows = []
    for line in raw.splitlines():
        s = line.strip()
        if not s or s.startswith("#") or s.startswith("age_"):
            continue
        parts = s.split()
        if len(parts) < 2:
            continue
        age_ka = float(parts[0])
        if age_ka > 7000:
            continue
        rsl = float(parts[1])
        year = int(round(1950 - age_ka * 1000))
        rows.append({"ageKa": round(age_ka, 1), "year": year, "seaLevelM": round(rsl, 1)})
    rows.sort(key=lambda r: -r["ageKa"])
    return downsample_extrema(rows, 280, "seaLevelM")


def parse_lr04() -> list[dict]:
    raw = fetch_cached(
        "lisiecki2005-d18o-stack-noaa.txt",
        "https://www.ncei.noaa.gov/pub/data/paleo/contributions_by_author/lisiecki2005/lisiecki2005-d18o-stack-noaa.txt",
        "NOAA NCEI / Paleoceanography; DOI 10.1029/2004PA001071",
        "10.1029/2004PA001071",
    ).decode("utf-8", errors="replace")
    rows = []
    for line in raw.splitlines():
        s = line.strip()
        if not s or s.startswith("#") or s.startswith("age_"):
            continue
        parts = s.split()
        if len(parts) < 3:
            continue
        age_ka = float(parts[0])
        if age_ka < 0.05:
            continue
        d18o = float(parts[1])
        err = float(parts[2])
        rows.append(
            {
                "ageKa": round(age_ka, 2),
                "year": int(round(1950 - age_ka * 1000)),
                "d18o": round(d18o, 2),
                "err": round(err, 2),
            }
        )
    rows.sort(key=lambda r: -r["ageKa"])
    deep = [r for r in rows if r["ageKa"] >= 800]
    pleist = [r for r in rows if r["ageKa"] < 800]
    return downsample_extrema(deep, 260, "d18o") + downsample_extrema(pleist, 180, "d18o")


def parse_epica_temp() -> list[dict]:
    raw = fetch_cached(
        "edc3deuttemp2007.txt",
        "https://www.ncei.noaa.gov/pub/data/paleo/icecore/antarctica/epica_domec/edc3deuttemp2007.txt",
        "NOAA NCEI / EPICA Community; DOI 10.1126/science.1141038",
        "10.1126/science.1141038",
    ).decode("utf-8", errors="replace")
    rows = []
    started = False
    for line in raw.splitlines():
        s = line.strip()
        if not started:
            if s.startswith("Bag") and "Temperature" in s:
                started = True
            continue
        if not s:
            continue
        parts = s.split()
        if len(parts) < 5:
            continue
        try:
            age_bp = float(parts[2])
            temp_c = float(parts[4])
        except ValueError:
            continue
        if age_bp < 50:
            continue
        rows.append(
            {
                "ageKa": round(age_bp / 1000.0, 3),
                "year": int(round(1950 - age_bp)),
                "tempC": round(temp_c, 2),
            }
        )
    rows.sort(key=lambda r: -r["ageKa"])
    old = [r for r in rows if r["ageKa"] >= 30]
    young = [r for r in rows if r["ageKa"] < 30]
    return downsample_extrema(old, 340, "tempC") + downsample_extrema(young, 180, "tempC")


def parse_spratt2016() -> list[dict]:
    raw = fetch_cached(
        "spratt2016-noaa.txt",
        "https://www.ncei.noaa.gov/pub/data/paleo/paleocean/by_contributor/spratt2016/spratt2016-noaa.txt",
        "NOAA NCEI / Climate of the Past; DOI 10.5194/cp-12-1079-2016",
        "10.5194/cp-12-1079-2016",
    ).decode("utf-8", errors="replace")
    rows = []
    for line in raw.splitlines():
        s = line.strip()
        if not s or s.startswith("#") or s.startswith("age_"):
            continue
        parts = s.split()
        if len(parts) < 9:
            continue
        age_ka = float(parts[0])
        if age_ka < 0.05:
            continue
        try:
            # Columns: age_calkaBP, SeaLev_shortPC1..err_up, SeaLev_longPC1, sig, err_lo, err_up
            rsl = float(parts[5])
            lo = float(parts[7])
            hi = float(parts[8])
        except ValueError:
            continue
        if math.isnan(rsl):
            continue
        rows.append(
            {
                "ageKa": round(age_ka, 1),
                "year": int(round(1950 - age_ka * 1000)),
                "seaLevelM": round(rsl, 1),
                "lo": round(lo, 1),
                "hi": round(hi, 1),
            }
        )
    rows.sort(key=lambda r: -r["ageKa"])
    old = [r for r in rows if r["ageKa"] >= 30]
    young = [r for r in rows if r["ageKa"] < 30]
    return downsample_extrema(old, 340, "seaLevelM") + young


def parse_bereiter_co2() -> list[dict]:
    raw = fetch_cached(
        "antarctica2015co2composite.txt",
        "https://www.ncei.noaa.gov/pub/data/paleo/icecore/antarctica/antarctica2015co2composite.txt",
        "NOAA NCEI / GRL; DOI 10.1002/2014GL061957",
        "10.1002/2014GL061957",
    ).decode("utf-8-sig", errors="replace")
    rows = []
    for line in raw.splitlines():
        s = line.strip()
        if not s or s.startswith("#") or s.startswith("age_"):
            continue
        parts = s.split()
        if len(parts) < 2:
            continue
        age_bp = float(parts[0])
        if age_bp < 50:
            continue
        ppm = float(parts[1])
        rows.append(
            {
                "ageKa": round(age_bp / 1000.0, 3),
                "year": int(round(1950 - age_bp)),
                "ppm": round(ppm, 1),
            }
        )
    rows.sort(key=lambda r: -r["ageKa"])
    old = [r for r in rows if r["ageKa"] >= 30]
    young = [r for r in rows if r["ageKa"] < 30]
    return downsample_extrema(old, 280, "ppm") + downsample_extrema(young, 180, "ppm")


def parse_epica_ch4() -> list[dict]:
    raw = fetch_cached(
        "edc-ch4-2008-noaa.txt",
        "https://www.ncei.noaa.gov/pub/data/paleo/icecore/antarctica/epica_domec/edc-ch4-2008-noaa.txt",
        "NOAA NCEI / Nature; DOI 10.1038/nature06950",
        "10.1038/nature06950",
    ).decode("utf-8", errors="replace")
    rows = []
    for line in raw.splitlines():
        s = line.strip()
        if not s or s.startswith("#") or s.startswith("depth_"):
            continue
        parts = s.split()
        if len(parts) < 3:
            continue
        try:
            age_bp = float(parts[1])
            ppb = float(parts[2])
        except ValueError:
            continue
        if age_bp < 50:
            continue
        rows.append(
            {
                "ageKa": round(age_bp / 1000.0, 3),
                "year": int(round(1950 - age_bp)),
                "ppb": round(ppb, 1),
            }
        )
    rows.sort(key=lambda r: -r["ageKa"])
    old = [r for r in rows if r["ageKa"] >= 30]
    young = [r for r in rows if r["ageKa"] < 30]
    return downsample_extrema(old, 260, "ppb") + downsample_extrema(young, 160, "ppb")


def parse_ngrip() -> list[dict]:
    raw = fetch_cached(
        "gicc05-60ka-20yr.txt",
        "https://www.ncei.noaa.gov/pub/data/paleo/icecore/greenland/summit/ngrip/gicc05-60ka-20yr.txt",
        "NOAA NCEI / NGRIP Members; DOI 10.1038/nature02805",
        "10.1038/nature02805",
    ).decode("utf-8", errors="replace")
    rows = []
    started = False
    for line in raw.splitlines():
        s = line.strip()
        if not started:
            if re.match(r"^\d+\s+[\d.]+\s+[-\d.]+", s):
                started = True
            else:
                continue
        parts = s.split()
        if len(parts) < 3:
            continue
        try:
            age_b2k = float(parts[0])
            d18o = float(parts[2])
        except ValueError:
            continue
        year = int(round(2000 - age_b2k))
        if year > 1900:
            continue
        rows.append(
            {
                "ageKa": round((1950 - year) / 1000.0, 3),
                "year": year,
                "d18o": round(d18o, 2),
            }
        )
    rows.sort(key=lambda r: r["year"])
    return downsample_extrema(rows, 360, "d18o")


def parse_temp12k() -> list[dict]:
    raw = fetch_cached(
        "temp12k_allmethods_percentiles.csv",
        "https://www.ncei.noaa.gov/pub/data/paleo/reconstructions/kaufman2020/temp12k_allmethods_percentiles.csv",
        "NOAA NCEI / Scientific Data; DOI 10.1038/s41597-020-0530-7",
        "10.1038/s41597-020-0530-7",
    ).decode("utf-8", errors="replace")
    rows = []
    reader = csv.DictReader(io.StringIO(raw))
    for r in reader:
        age_bp = float(r["ages"])
        if age_bp < 50:
            continue
        year = int(round(1950 - age_bp))
        rows.append(
            {
                "ageKa": round(age_bp / 1000.0, 2),
                "year": year,
                "tempC": round(float(r[" global_median"].strip() if " global_median" in r else r["global_median"]), 3),
                "p05": round(float(r[" global_5"].strip() if " global_5" in r else r["global_5"]), 3),
                "p95": round(float(r[" global_95"].strip() if " global_95" in r else r["global_95"]), 3),
            }
        )
    rows.sort(key=lambda r: r["year"])
    return rows


def parse_pages2k() -> list[dict]:
    raw = fetch_cached(
        "pages2k_full_ensemble_median_95pct.txt",
        "https://www.ncei.noaa.gov/pub/data/paleo/pages2k/neukom2019temp/recons/Full_ensemble_median_and_95pct_range.txt",
        "NOAA NCEI / Nature Geoscience; DOI 10.1038/s41561-019-0400-0",
        "10.1038/s41561-019-0400-0",
    ).decode("utf-8", errors="replace")
    annual = []
    for line in raw.splitlines():
        s = line.strip()
        if not s or s.startswith("#") or s.startswith("Year"):
            continue
        parts = s.split("\t")
        if len(parts) < 5:
            continue
        yr = int(float(parts[0]))
        if yr < 1 or yr > 1900:
            continue
        med = float(parts[2])
        lo = float(parts[3])
        hi = float(parts[4])
        annual.append({"year": yr, "tempC": med, "lo": lo, "hi": hi})
    annual.sort(key=lambda r: r["year"])
    key_years = {1, 536, 540, 541, 1258, 1259, 1453, 1601, 1816, 1900}
    out = []
    # Keep 5-year averages plus exact annual dips for major volcanic cooling excursions
    by_year = {r["year"]: r for r in annual}
    for i in range(0, len(annual), 5):
        chunk = annual[i : i + 5]
        mid = chunk[len(chunk) // 2]["year"]
        out.append(
            {
                "year": mid,
                "tempC": round(sum(c["tempC"] for c in chunk) / len(chunk), 3),
                "lo": round(min(c["lo"] for c in chunk), 3),
                "hi": round(max(c["hi"] for c in chunk), 3),
            }
        )
    existing = {r["year"] for r in out}
    for y in key_years:
        if y in by_year and y not in existing:
            r = by_year[y]
            out.append({"year": y, "tempC": round(r["tempC"], 3), "lo": round(r["lo"], 3), "hi": round(r["hi"], 3)})
    out.sort(key=lambda r: r["year"])
    return out


# ---------------- Ice Sheet Vector Helpers ----------------

def dp_simplify(pts: list[list[float]], tol: float) -> list[list[float]]:
    if len(pts) <= 4:
        return pts
    tol2 = tol * tol

    def seg_dist2(p, a, b):
        x, y = p
        ax, ay = a
        bx, by = b
        dx, dy = bx - ax, by - ay
        if dx == 0 and dy == 0:
            return (x - ax) ** 2 + (y - ay) ** 2
        t = ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)
        t = max(0.0, min(1.0, t))
        return (x - (ax + t * dx)) ** 2 + (y - (ay + t * dy)) ** 2

    keep = [False] * len(pts)
    keep[0] = True
    keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i0, i1 = stack.pop()
        if i1 - i0 < 2:
            continue
        max_d2 = -1.0
        max_i = -1
        a, b = pts[i0], pts[i1]
        for i in range(i0 + 1, i1):
            d2 = seg_dist2(pts[i], a, b)
            if d2 > max_d2:
                max_d2 = d2
                max_i = i
        if max_d2 > tol2 and max_i != -1:
            keep[max_i] = True
            stack.append((i0, max_i))
            stack.append((max_i, i1))
    return [pts[i] for i, k in enumerate(keep) if k]


def ring_area_deg2(ring: list[list[float]]) -> float:
    s = 0.0
    for i in range(len(ring) - 1):
        x1, y1 = ring[i]
        x2, y2 = ring[i + 1]
        s += x1 * y2 - x2 * y1
    return abs(s) * 0.5


def simplify_ring(ring: list[list[float]], tol: float, min_area: float = 0.25) -> list[list[float]] | None:
    if len(ring) < 4:
        return None
    if ring[0] != ring[-1]:
        ring = ring + [ring[0]]
    half = len(ring) // 2
    simp = dp_simplify(ring[: half + 1], tol)[:-1] + dp_simplify(ring[half:], tol)
    if len(simp) < 4:
        return None
    if simp[0] != simp[-1]:
        simp[-1] = simp[0]
    simp = [[round(x, 2), round(max(-89.9, min(89.9, y)), 2)] for x, y in simp]
    if simp[0] != simp[-1]:
        simp[-1] = simp[0]
    if len(simp) < 4 or ring_area_deg2(simp) < min_area:
        return None
    return simp


def laea_north_pole_to_wgs84(x: float, y: float) -> list[float]:
    # North Pole Lambert Azimuthal Equal Area spherical inverse (WGS84 authalic R=6371007.2)
    R = 6371007.2
    rho = math.hypot(x, y)
    if rho < 1e-6:
        return [0.0, 90.0]
    sin_c = min(1.0, rho / (2.0 * R))
    c = 2.0 * math.asin(sin_c)
    lat = math.degrees(math.asin(max(-1.0, min(1.0, math.cos(c)))))
    lon = math.degrees(math.atan2(x, -y))
    return [lon, lat]


def parse_shp_polygons(shp_bytes: bytes, is_laea: bool, tol: float, min_area: float) -> list[list[list[list[float]]]]:
    """Parse ESRI Shapefile Polygon/PolygonZ/PolygonM bytes -> list of MultiPolygon polygons."""
    pos = 100
    n_bytes = len(shp_bytes)
    polys: list[list[list[list[float]]]] = []
    while pos + 8 <= n_bytes:
        _rec_num, content_len_words = struct.unpack(">ii", shp_bytes[pos : pos + 8])
        pos += 8
        rec_end = pos + content_len_words * 2
        if rec_end > n_bytes:
            break
        shape_type = struct.unpack("<i", shp_bytes[pos : pos + 4])[0]
        if shape_type in (5, 15, 25):  # Polygon types
            num_parts, num_pts = struct.unpack("<ii", shp_bytes[pos + 36 : pos + 44])
            parts = list(struct.unpack(f"<{num_parts}i", shp_bytes[pos + 44 : pos + 44 + 4 * num_parts]))
            pts_off = pos + 44 + 4 * num_parts
            raw_pts = struct.unpack(f"<{num_pts * 2}d", shp_bytes[pts_off : pts_off + 16 * num_pts])
            pts = [[raw_pts[2 * i], raw_pts[2 * i + 1]] for i in range(num_pts)]
            for idx, start in enumerate(parts):
                end = parts[idx + 1] if idx + 1 < len(parts) else num_pts
                ring = pts[start:end]
                if is_laea:
                    # Skip rings that encircle the North Pole directly unless broken cleanly? No, check!
                    ring = [laea_north_pole_to_wgs84(px, py) for px, py in ring]
                # Unwrap lon jumps across +-180 by splitting/clamping? Keep strictly inside [-180, 180]
                # D3 spherical geoPath draws great-circle shortest arcs across +-180 cleanly!
                sring = simplify_ring(ring, tol, min_area)
                if sring:
                    # Emit each large ring as its own outer polygon (visual ice envelope)
                    polys.append([sring])
        pos = rec_end
    return polys


def fetch_batchelor2019() -> list[dict]:
    meta_json = fetch_cached(
        "batchelor2019-osf-index.json",
        "https://api.osf.io/v2/nodes/7jen3/files/osfstorage/?page[size]=50",
        "CC BY 4.0; DOI 10.1038/s41467-019-11601-2",
        "10.1038/s41467-019-11601-2",
    )
    root_items = json.loads(meta_json.decode("utf-8"))["data"]

    # Author midpoints & literature bounds from Batchelor et al. (2019) Table/README & README.txt
    slice_meta = [
        ("Late Gauss Chron", "batchelor-late-gauss", "Pliocene–Pleistocene ~3.0 Ma (Late Gauss 3.59–2.6 Ma)", 3000.0, 2580.0, 3590.0, -25.0, "Extensive Fennoscandian/Barents and early Cordilleran/Greenland ice"),
        ("Early Matuyama Chron", "batchelor-early-matuyama", "Early Pleistocene ~2.2 Ma (Early Matuyama 2.6–1.78 Ma)", 2200.0, 1780.0, 2580.0, -45.0, "Onset of major Northern Hemisphere glaciations; early Laurentide & Eurasian sheets"),
        ("MIS 20-24", "batchelor-mis22", "Mid-Pleistocene Transition (~900–790 ka · MIS 20–24)", 860.0, 770.0, 950.0, -90.0, "First 100-kyr deep glacial cycles crossing North American & Eurasian lowlands"),
        ("MIS 16", "batchelor-mis16", "MIS 16 Extreme Glacial (~650 ka · 677–622 ka)", 650.0, 600.0, 720.0, -110.0, "Severe cold stage expanding Laurentide and Eurasian ice south of 50°N"),
        ("MIS 12", "batchelor-mis12", "Elsterian / Anglian Glacial (~450 ka · MIS 12)", 450.0, 420.0, 500.0, -125.0, "Deepest Mid-Pleistocene glacial (~450 ka), cutting British-Irish–Channel landscapes"),
        ("MIS 10", "batchelor-mis10", "MIS 10 Glacial (~350 ka · 365–337 ka)", 350.0, 325.0, 390.0, -105.0, "Extensive North American & Eurasian ice margins during Homo heidelbergensis period"),
        ("MIS 8", "batchelor-mis8", "MIS 8 Glacial (~260 ka · 279–243 ka)", 260.0, 235.0, 300.0, -95.0, "Moderate glacial stage before the Saalian expansion"),
        ("MIS 6", "batchelor-mis6", "Saalian / Illinoian Glacial (~140 ka · MIS 6)", 140.0, 130.0, 200.0, -120.0, "Vast Eurasian & Dnieper/Don ice lobes coinciding with early Neanderthal & African MSA"),
        ("MIS 5d", "batchelor-mis5d", "Early Last Glacial Stadial (~112 ka · MIS 5d)", 112.0, 107.0, 120.0, -55.0, "Renewed Laurentide, Barents and Scandinavian inception after MIS 5e"),
        ("MIS 5b", "batchelor-mis5b", "MIS 5b Stadial (~89 ka · 92–86 ka)", 89.0, 84.0, 96.0, -58.0, "Pre-Würm / Early Wisconsinan ice expansion"),
        ("MIS 4", "batchelor-mis4", "MIS 4 Cold Stadial (~65 ka · 72–58 ka)", 65.0, 52.0, 76.0, -85.0, "Major pre-LGM cooling (~65 ka) exposing Sahul, Sunda and Beringian shelves"),
        ("45 ka", "batchelor-45ka", "MIS 3 Interstadial Ice Sheets (45 ka)", 45.0, 42.5, 52.0, -68.0, "Retreated Scandinavian & reduced Laurentide margins (~45 ka)"),
        ("40 ka", "batchelor-40ka", "40 ka Ice Sheets (MIS 3)", 40.0, 37.5, 42.5, -72.0, "40 ka Northern Hemisphere best-estimate configuration"),
        ("35 ka", "batchelor-35ka", "35 ka Ice Sheets (Late MIS 3)", 35.0, 32.5, 37.5, -78.0, "Ice advancing toward Late Glacial Maximum across Canada & Fennoscandia"),
        ("30 ka", "batchelor-30ka", "30 ka Ice Sheets (Early MIS 2)", 30.0, 25.1, 32.5, -95.0, "Rapid buildup toward Last Glacial Maximum (~30 ka)"),
    ]

    folder_map = {x["attributes"]["name"]: x for x in root_items if x["attributes"]["kind"] == "folder"}
    slices = []
    for folder_name, sid, label, age_ka, min_ka, max_ka, sl_m, note in slice_meta:
        f = folder_map[folder_name]
        sub_url = f["relationships"]["files"]["links"]["related"]["href"]
        sub_list = json.loads(fetch_cached(f"batchelor-{sid}-dir.json", sub_url, "CC BY 4.0", "10.1038/s41467-019-11601-2"))["data"]
        recon_folder = next(x for x in sub_list if "hypothes" in x["attributes"]["name"].lower())
        files_url = recon_folder["relationships"]["files"]["links"]["related"]["href"] + "?page[size]=50"
        files = json.loads(fetch_cached(f"batchelor-{sid}-files.json", files_url, "CC BY 4.0", "10.1038/s41467-019-11601-2"))["data"]
        shp_entry = next(x for x in files if x["attributes"]["name"].endswith("_best_estimate.shp"))
        prj_entry = next(x for x in files if x["attributes"]["name"].endswith("_best_estimate.prj"))
        shp_bytes = fetch_cached(f"batchelor/{shp_entry['attributes']['name']}", shp_entry["links"]["download"], "CC BY 4.0; Batchelor et al. (2019)", "10.1038/s41467-019-11601-2")
        prj_txt = fetch_cached(f"batchelor/{prj_entry['attributes']['name']}", prj_entry["links"]["download"], "CC BY 4.0", "10.1038/s41467-019-11601-2").decode("utf-8", errors="ignore")
        is_laea = "Lambert_Azimuthal_Equal_Area" in prj_txt
        polys = parse_shp_polygons(shp_bytes, is_laea=is_laea, tol=0.45, min_area=0.4)
        print(f"  Batchelor {folder_name}: is_laea={is_laea}, polygons={len(polys)}", flush=True)
        slices.append(
            {
                "id": sid,
                "label": label,
                "region": "Northern Hemisphere",
                "ageKa": age_ka,
                "minAgeKa": min_ka,
                "maxAgeKa": max_ka,
                "seaLevelM": sl_m,
                "sourceId": "batchelor2019",
                "note": note,
                "geometry": {"type": "MultiPolygon", "coordinates": polys},
            }
        )
    return slices


def fetch_dated1_and_nadi1() -> list[dict]:
    # Download DATED-1 (CC BY 3.0) KMZ in WGS84 and pair Eurasia (DATED-1) + North America (NADI-1 OPTIMAL simplified)
    kmz_bytes = fetch_cached(
        "DATED-1_TimeSlices_kmz.zip",
        "https://store.pangaea.de/Publications/HughesA-etal_2015/DATED-1_TimeSlices_kmz.zip",
        "CC BY 3.0; Hughes et al. (2016) DOI 10.1111/bor.12142",
        "10.1594/PANGAEA.848117",
    )
    nadi_raw = json.loads((ROOT / "data" / "ice-snapshots.json").read_text(encoding="utf-8"))
    nadi_opt = {
        int(s["ageCalBP"]): s["geometry"]
        for s in nadi_raw["snapshots"]
        if s["scenario"] == "optimal"
    }

    z = zipfile.ZipFile(io.BytesIO(kmz_bytes))
    inner_kmz_name = next(n for n in z.namelist() if n.lower().endswith(".kmz"))
    iz = zipfile.ZipFile(io.BytesIO(z.read(inner_kmz_name)))
    doc_kml = iz.read(next(n for n in iz.namelist() if n.lower().endswith(".kml")))
    root_xml = ET.fromstring(doc_kml)

    # Index DATED-1 folders like TS10_mc, TS11_mc, ... TS25_mc
    dated1_mc: dict[int, list[list[list[list[float]]]]] = {}

    def folder_polys(folder_el: ET.Element) -> list[list[list[list[float]]]]:
        polys: list[list[list[list[float]]]] = []
        for elem in folder_el.iter():
            if elem.tag.endswith("outerBoundaryIs"):
                coord_el = next((c for c in elem.iter() if c.tag.endswith("coordinates") and c.text), None)
                if coord_el is not None and coord_el.text:
                    pts = []
                    for tok in coord_el.text.strip().split():
                        parts = tok.split(",")
                        if len(parts) >= 2:
                            pts.append([float(parts[0]), float(parts[1])])
                    sring = simplify_ring(pts, tol=0.22, min_area=0.10)
                    if sring:
                        polys.append([sring])
        return polys

    for el in root_xml.iter():
        if el.tag.endswith("Folder"):
            name_el = next((c for c in el if c.tag.endswith("name") and c.text), None)
            if name_el is not None:
                m = re.match(r"^TS(\d+)_mc$", name_el.text.strip(), re.I)
                if m:
                    ka_int = int(m.group(1))
                    dated1_mc[ka_int] = folder_polys(el)

    # Pair key deglacial ages (ka) from 25 ka down to 10 ka, then NADI-1 Holocene 9..1 ka
    eurasia_ages = [25, 23, 21, 19, 17, 15, 13, 12, 11, 10]
    holocene_ages = [9, 8, 7, 6, 4, 1]
    slices = []

    for ka in eurasia_ages:
        eur_polys = dated1_mc.get(ka, [])
        if not eur_polys:
            # Fallback to nearest available TSxx_mc folder in DATED-1 if an exact integer was omitted
            nearest_k = min(dated1_mc.keys(), key=lambda k: abs(k - ka)) if dated1_mc else None
            if nearest_k is not None and abs(nearest_k - ka) <= 1:
                eur_polys = dated1_mc[nearest_k]
        # Extract simplified NADI-1 polygons for this age (exact match in 500-yr snapshots!)
        na_polys: list = []
        nadi_geom = nadi_opt.get(ka * 1000)
        if nadi_geom:
            geoms = nadi_geom.get("geometries", [nadi_geom])
            for g in geoms:
                coords_list = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
                for poly in coords_list:
                    sr = simplify_ring(poly[0], tol=0.25, min_area=0.15)
                    if sr:
                        na_polys.append([sr])
        print(f"  Global deglacial {ka} ka: DATED-1 polys={len(eur_polys)}, NADI-1 polys={len(na_polys)}", flush=True)
        sl_table = {25: -120, 23: -123, 21: -125, 19: -116, 17: -108, 15: -98, 13: -72, 12: -62, 11: -50, 10: -38}
        note_table = {
            21: "Last Glacial Maximum peak (~21 ka): Laurentide–Cordilleran sheet unites across Canada; Fennoscandian & British-Irish sheets peak; ~−125 m sea level exposes Beringia, Sundaland & Doggerland.",
            15: "Early deglaciation (15 ka): Bølling–Allerød warming begins rapid margin retreat and Meltwater Pulse 1A.",
            12: "Younger Dryas cold reversal (~12 ka): Fennoscandian and Laurentide retreat stalls briefly in the Ra / Salpausselkä moraines.",
            10: "Early Holocene (10 ka): Fennoscandian ice nearly gone; Doggerland lowland still exposed across the southern North Sea.",
        }
        slices.append(
            {
                "id": f"deglacial-{ka}ka",
                "label": f"{ka} ka ({1950 - ka * 1000:,} BCE)".replace("-", ""),
                "region": "North America + Eurasia",
                "ageKa": float(ka),
                "minAgeKa": ka - 0.99,
                "maxAgeKa": ka + 1.0,
                "seaLevelM": float(sl_table[ka]),
                "sourceId": "nadi1-dated1",
                "note": note_table.get(ka, f"Paired NADI-1 North American OPTIMAL + DATED-1 Eurasian most-credible ice margins at {ka} ka cal BP."),
                "geometry": {"type": "MultiPolygon", "coordinates": na_polys + eur_polys},
            }
        )

    for ka in holocene_ages:
        na_polys = []
        nadi_geom = nadi_opt.get(ka * 1000)
        if nadi_geom:
            geoms = nadi_geom.get("geometries", [nadi_geom])
            for g in geoms:
                coords_list = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
                for poly in coords_list:
                    sr = simplify_ring(poly[0], tol=0.25, min_area=0.15)
                    if sr:
                        na_polys.append([sr])
        sl_table = {9: -26, 8: -16, 7: -8, 6: -3, 4: -1, 1: 0}
        note_table = {
            9: "Laurentide ice splits around Hudson Bay; Scandinavian ice sheet melted.",
            8: "Drainage of glacial Lake Agassiz–Ojibway triggers the 8.2 ka cold event.",
            7: "Residual Labrador–Baffin domes collapse; Doggerland and Torres Strait inundated.",
            6: "Mid-Holocene Thermal Maximum: only Baffin, Ellesmere and Greenland ice persist (plus Alpine/polar caps).",
            4: "Neoglacial cooling begins; Arctic ice close to modern extent.",
            1: "Persistent Greenland & High Arctic ice caps reference (0.05–1 ka, carrying through 1900 CE).",
        }
        year_str = f"{1950 - ka * 1000} CE" if 1950 - ka * 1000 > 0 else f"{1951 - ka * 1000} BCE"
        slices.append(
            {
                "id": f"holocene-{ka}ka",
                "label": f"{ka} ka ({year_str})" if ka > 1 else "Holocene–1900 CE Persistent Ice Caps",
                "region": "Greenland & High Arctic",
                "ageKa": float(ka),
                "minAgeKa": 0.05 if ka == 1 else ka - 0.99,
                "maxAgeKa": ka + 0.99,
                "seaLevelM": float(sl_table[ka]),
                "sourceId": "nadi1",
                "note": note_table[ka],
                "geometry": {"type": "MultiPolygon", "coordinates": na_polys},
            }
        )
    return slices


def main() -> None:
    print("Building paleoclimate series (7 Ma -> 1900 CE)...", flush=True)
    miller = parse_miller2020()
    lr04 = parse_lr04()
    epica_t = parse_epica_temp()
    spratt = parse_spratt2016()
    co2 = parse_bereiter_co2()
    ch4 = parse_epica_ch4()
    ngrip = parse_ngrip()
    temp12k = parse_temp12k()
    pages2k = parse_pages2k()

    milestones = [
        {
            "id": "miocene-tortonian",
            "ageKa": 6800,
            "year": -6798050,
            "shortLabel": "Tortonian–Messinian ~6.8 Ma",
            "label": "Late Miocene Cooling & C4 Savanna Expansion (~7–5.5 Ma)",
            "epoch": "deep",
            "summary": "Global ocean cooling (~3–4 °C warmer than today) accompanies tropical C4 grassland expansion in East Africa and Sahel around the earliest hominins (Sahelanthropus, Orrorin, Ardipithecus).",
            "humanContext": "Mosaic woodland–savanna habitats emerge as earliest hominins diverge across Chad, Kenya, and Ethiopia.",
            "caution": "Regional aridification varied strongly by basin; continental proxy coverage before 5 Ma is sparser than Quaternary cores.",
            "doi": "https://doi.org/10.1038/s41561-022-00982-7",
        },
        {
            "id": "nhg-onset",
            "ageKa": 2700,
            "year": -2698050,
            "shortLabel": "NH Glaciation ~2.7 Ma",
            "label": "Intensification of Northern Hemisphere Glaciation (~2.7 Ma)",
            "epoch": "deep",
            "summary": "LR04 benthic d18O rises sharply as 41-kyr obliquity cycles begin driving large Arctic & sub-Arctic ice sheets and global sea-level swings of ~40–60 m.",
            "humanContext": "Coincides with Oldowan stone tools (Lomekwi/Gona), early Homo emergence, and Australopithecus diversification.",
            "caution": "Climate shifts created alternating wet/dry pulses rather than a single linear drying trend.",
            "doi": "https://doi.org/10.1029/2004PA001071",
        },
        {
            "id": "mpt",
            "ageKa": 900,
            "year": -898050,
            "shortLabel": "Mid-Pleistocene Transition ~900 ka",
            "label": "Mid-Pleistocene Transition (~1.25–0.7 Ma)",
            "epoch": "deep",
            "summary": "Earth's glacial rhythm shifts without a change in orbital forcing from 41-kyr cycles to deep ~100-kyr ice ages (~100–125 m sea-level drops).",
            "humanContext": "Follows early Eurasian dispersals (Dmanisi, Java, Nihewan, Europe) and precedes classic Middle Pleistocene Acheulean sites.",
            "caution": "Transition unfolded over ~500 kyr rather than a sudden single event.",
            "doi": "https://doi.org/10.1126/science.1221294",
        },
        {
            "id": "mis12",
            "ageKa": 450,
            "year": -448050,
            "shortLabel": "MIS 12 (~450 ka)",
            "label": "MIS 12 Extreme Glacial (~450 ka)",
            "epoch": "ice-ages",
            "summary": "One of the cold extreme glacials of the past million years (~−125 m sea level); proglacial lake drainage breaches the Strait of Dover chalk ridge.",
            "humanContext": "Contemporary with Sima de los Huesos and early Eurasian pre-Neanderthals.",
            "caution": "Benthic d18O mixes global ice volume and deep-water temperature.",
            "doi": "https://doi.org/10.1038/s41467-019-11601-2",
        },
        {
            "id": "mis5e",
            "ageKa": 125,
            "year": -123050,
            "shortLabel": "MIS 5e (~125 ka)",
            "label": "Last Interglacial Peak (Eemian / MIS 5e, ~129–116 ka)",
            "epoch": "ice-ages",
            "summary": "Global temperatures reach ~+0.5 to +1.5 °C above pre-industrial, Greenland and West Antarctic ice shrink, and sea level peaks ~+6 to +9 m.",
            "humanContext": "Broad woodland belt spans Europe (Neanderthals at Krapina/Neumark-Nord) while Humid Arabian/Saharan corridors open for early Homo sapiens (Skhul/Qafzeh).",
            "caution": "Peak warmth was geographically uneven and lagged orbital insolation.",
            "doi": "https://doi.org/10.1002/2015rg000482",
        },
        {
            "id": "mis4",
            "ageKa": 65,
            "year": -63050,
            "shortLabel": "MIS 4 (~65 ka)",
            "label": "MIS 4 Glacial Expansion (~72–58 ka)",
            "epoch": "ice-ages",
            "summary": "Sea level drops ~−85 m, dramatically narrowing Wallacean water crossings and merging Java–Sumatra–Borneo (Sundaland) and Australia–New Guinea (Sahul).",
            "humanContext": "Major Out-of-Africa dispersal window and earliest dated Australian rock-shelter occupations (~65–50 ka).",
            "caution": "Sea-level curves carry ±10–15 m global error bars and local isostatic variations.",
            "doi": "https://doi.org/10.5194/cp-12-1079-2016",
        },
        {
            "id": "do-oscillations",
            "ageKa": 40,
            "year": -38050,
            "shortLabel": "Dansgaard–Oeschger ~40 ka",
            "label": "Rapid Dansgaard–Oeschger & Heinrich Swings (~60–25 ka)",
            "epoch": "holocene",
            "summary": "Greenland ice cores show abrupt 5–8 °C North Atlantic warming jumps within decades followed by century-to-millennial cooling during MIS 3.",
            "humanContext": "Coincides with Upper Paleolithic dispersals into Eurasia and the final documented Neanderthal horizons (~45–39 ka).",
            "caution": "Abrupt Greenland spikes were strongly amplified in the North Atlantic compared with tropical hemispheres.",
            "doi": "https://doi.org/10.1038/nature02805",
        },
        {
            "id": "lgm",
            "ageKa": 21,
            "year": -19050,
            "shortLabel": "LGM (~21 ka)",
            "label": "Last Glacial Maximum (~23–19 ka)",
            "epoch": "holocene",
            "summary": "Global mean temperature ~−6 °C below pre-industrial, CO2 ~185–190 ppm, and global sea level ~−125 m below today, uniting Siberia with Alaska (Beringia).",
            "humanContext": "Populations contract toward southern Eurasian refugia while Beringian / Pacific rim corridors frame early peopling of the Americas.",
            "caution": "Ice-free corridors and coastal kelp routes opened asynchronously between ~17–14 ka.",
            "doi": "https://doi.org/10.1016/j.quascirev.2023.108345",
        },
        {
            "id": "mwp1a",
            "ageKa": 14.5,
            "year": -12550,
            "shortLabel": "Bølling & MWP-1A (~14.6 ka)",
            "label": "Bølling Warming & Meltwater Pulse 1A (~14.7–14.2 ka)",
            "epoch": "holocene",
            "summary": "Rapid deglacial warming drives ~15–20 m of global sea-level rise within ~400–500 years as ice sheets collapse.",
            "humanContext": "Marks accelerating coastal submergence of Sundaland, Beringia, and North Sea lowlands alongside Late Pleistocene Americas settlements.",
            "caution": "Individual coral reef terraces constrain MWP-1A amplitude but vary by far-field GIA response.",
            "doi": "https://doi.org/10.1073/pnas.1411762111",
        },
        {
            "id": "younger-dryas",
            "ageKa": 12.2,
            "year": -10250,
            "shortLabel": "Younger Dryas (~12.9–11.7 ka)",
            "label": "Younger Dryas Stadial (~12.9–11.7 ka)",
            "epoch": "holocene",
            "summary": "Abrupt return to near-glacial cold in North Atlantic & Europe as AMOC weakens, terminating sharply ~11.7 ka at the start of the Holocene.",
            "humanContext": "Precedes Natufian–Early Neolithic sedentary transitions and correlates with cooling/drying stresses across northern latitudes.",
            "caution": "Antarctic cores warm while Greenland cools (bipolar seesaw); not uniformly cold worldwide.",
            "doi": "https://doi.org/10.1038/nature02805",
        },
        {
            "id": "ahp-holocene",
            "ageKa": 8.2,
            "year": -6250,
            "shortLabel": "Green Sahara & 8.2 ka event",
            "label": "African Humid Period & 8.2 ka Cooling Event (~10–5.5 ka)",
            "epoch": "holocene",
            "summary": "Stronger summer orbital insolation sustains vegetated Sahara lakes & savanna corridors, punctuated by a ~150-yr 8.2 ka cold anomaly from Lake Agassiz drainage.",
            "humanContext": "Saharan pastoralism (Takarkori/Gobero) and early Eurasian/Yangtze agriculture expand; Doggerland submerges beneath the North Sea.",
            "caution": "Global Holocene temperature reconstructions differ slightly between proxy compilations and climate models.",
            "doi": "https://doi.org/10.1038/s41597-020-0530-7",
        },
        {
            "id": "42ka-event",
            "ageKa": 4.2,
            "year": -2250,
            "shortLabel": "4.2 ka Megadrought",
            "label": "Mid-to-Late Holocene Transition / 4.2 ka Aridification (~2250 BCE)",
            "epoch": "holocene",
            "summary": "Sahara–Arabian–Indus monsoon weakening marks the end of humid Saharan conditions and widespread regional hydroclimate shifts.",
            "humanContext": "Overlaps Old Kingdom Egypt, Akkadian Mesopotamia, and mature Indus urbanization transformations without implying single-factor collapse.",
            "caution": "Signal strength is regional (strongest in monsoon/Mediterranean zones), modest in global mean temperature.",
            "doi": "https://doi.org/10.1038/s41597-020-0445-3",
        },
        {
            "id": "lalia-536",
            "ageKa": 1.41,
            "year": 536,
            "shortLabel": "536 CE Volcanic Cooling",
            "label": "Late Antique Little Ice Age (536–541 CE Volcanic Cluster)",
            "epoch": "common-era",
            "summary": "Twin–triple volcanic sulfate spikes recorded in Greenland & Antarctic ice cores plus severe European/Asian tree-ring growth narrowing.",
            "humanContext": "Documented by Mediterranean and East Asian chroniclers as an 18-month solar dimming followed by cold summers.",
            "caution": "Direct human casualties depended heavily on local harvests, grain stores, and trade networks.",
            "doi": "https://doi.org/10.1038/s41561-019-0400-0",
        },
        {
            "id": "mca",
            "ageKa": 0.9,
            "year": 1050,
            "shortLabel": "Medieval Climate ~950–1250 CE",
            "label": "Medieval Climate Anomaly (~950–1250 CE)",
            "epoch": "common-era",
            "summary": "PAGES 2k multiproxy synthesis shows warm episodes that peaked regionally at different centuries rather than a globally synchronous warm plateau.",
            "humanContext": "Coincides with Norse North Atlantic expansion and warm Pacific voyages before Pacific/American drought transitions.",
            "caution": "Peak warmth was neither globally uniform nor warmer than 20th-century industrial decades.",
            "doi": "https://doi.org/10.1038/s41561-019-0400-0",
        },
        {
            "id": "lia-1600",
            "ageKa": 0.35,
            "year": 1600,
            "shortLabel": "Little Ice Age (~1450–1850 CE)",
            "label": "Little Ice Age Coldest Phase (~1570–1710 CE)",
            "epoch": "common-era",
            "summary": "Clustered tropical volcanism (Samalas 1257, Kuwae 1452, Huaynaputina 1600) and solar minima cool global mean temperature ~−0.3 to −0.5 °C below mid-Holocene baselines.",
            "humanContext": "Alpine glaciers advance across Europe; tree rings and Gergis & Fowler (2009) ENSO tables document severe drought/frost oscillations.",
            "caution": "Cooling magnitude was ~1–1.5 °C regionally in Europe/North America but ~0.3–0.5 °C in the global mean.",
            "doi": "https://doi.org/10.1038/s41561-019-0400-0",
        },
        {
            "id": "tambora-1815",
            "ageKa": 0.134,
            "year": 1816,
            "shortLabel": "Tambora 1815 / 1816",
            "label": "1815 Tambora Eruption & 1816 'Year Without a Summer'",
            "epoch": "common-era",
            "summary": "VEI 7 eruption in Indonesia injects massive stratospheric aerosols, dropping 1816 PAGES 2k global temperature sharply alongside Europe/New England crop failures.",
            "humanContext": "Links directly to the Smithsonian Global Volcanism Program entry in the atlas natural-hazard catalog.",
            "caution": "Post-1850 warming accelerates toward the 1900 CE end of the atlas historical scope.",
            "doi": "https://doi.org/10.1038/s41561-019-0400-0",
        },
    ]

    landbridges = [
        {
            "id": "torres-sahul",
            "name": "Torres Strait & Bass Strait (Sahul)",
            "thresholdM": -12,
            "summary": "Australia, New Guinea, and Tasmania unite into Greater Sahul whenever sea level falls below ~−12 to −55 m; flooded by ~8–9 ka.",
            "doi": "https://doi.org/10.1073/pnas.1411762111",
        },
        {
            "id": "english-channel",
            "name": "Strait of Dover (Britain–Continent)",
            "thresholdM": -35,
            "summary": "Britain connects overland to continental Europe until rising meltwater breaches the Channel ~8.5–8.0 ka.",
            "doi": "https://doi.org/10.5194/cp-12-1079-2016",
        },
        {
            "id": "doggerland",
            "name": "Doggerland (Southern North Sea)",
            "thresholdM": -40,
            "summary": "Broad Mesolithic lowland linking England, Denmark, and Netherlands; mostly inundated by ~8.2–7.5 ka.",
            "doi": "https://doi.org/10.1111/bor.12142",
        },
        {
            "id": "beringia",
            "name": "Bering Land Bridge (Siberia–Alaska)",
            "thresholdM": -50,
            "summary": "Broad plain connecting Northeast Asia and Alaska during glacials (~70–58 ka & ~30–11 ka) below −50 m sea level.",
            "doi": "https://doi.org/10.5194/cp-12-1079-2016",
        },
        {
            "id": "sundaland",
            "name": "Sundaland (Malay–Sumatra–Java–Borneo)",
            "thresholdM": -60,
            "summary": "Exposes an extra >1.8 million km² of Southeast Asian shelf below −60 m, leaving narrow Wallacean sea crossings even at LGM.",
            "doi": "https://doi.org/10.1126/sciadv.aaz1346",
        },
    ]

    series_payload = {
        "generated": "2026-11-21",
        "maxYear": 1900,
        "miller2020": miller,
        "lr04": lr04,
        "epicaTemp": epica_t,
        "sprattSeaLevel": spratt,
        "bereiterCo2": co2,
        "epicaCh4": ch4,
        "ngripD18o": ngrip,
        "temp12k": temp12k,
        "pages2k": pages2k,
        "milestones": milestones,
        "landbridges": landbridges,
    }
    SERIES_OUT.write_text(json.dumps(series_payload, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {SERIES_OUT} ({SERIES_OUT.stat().st_size // 1024} KB)")

    print("Building continuous CC-BY global ice-sheet slices...", flush=True)
    batchelor_slices = fetch_batchelor2019()
    deglacial_slices = fetch_dated1_and_nadi1()
    all_slices = sorted(batchelor_slices + deglacial_slices, key=lambda s: -s["ageKa"])
    ice_payload = {
        "method": "Combined peer-reviewed CC-BY Quaternary & deglacial ice-sheet reconstructions: Batchelor et al. (2019, CC BY 4.0) Northern Hemisphere best-estimate polygons (~3 Ma to 30 ka); paired DATED-1 (Hughes et al. 2016, CC BY 3.0) Eurasia + NADI-1 OPTIMAL (Dalton et al. 2023, CC BY 4.0) North America (25–10 ka); NADI-1 retreating North American domes & persistent Greenland/High Arctic reference (9–1 ka through 1900 CE). Polygons simplified for continuous web mapping; ring winding normalized via D3 spherical area.",
        "slices": all_slices,
    }
    ICE_OUT.write_text(json.dumps(ice_payload, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {ICE_OUT} ({ICE_OUT.stat().st_size // 1024} KB), slices={len(all_slices)}")

    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {MANIFEST_PATH} ({len(manifest)} entries)")


if __name__ == "__main__":
    main()
