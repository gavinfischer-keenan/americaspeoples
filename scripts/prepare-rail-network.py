"""Prepare an attributed historical rail layer from Jeremy Atack's 2023 archive.

Usage: python scripts/prepare-rail-network.py PATH_TO_UNZIPPED_ARCHIVE
Requires pyshp, shapely and pyproj. This script never substitutes modern rail data.
"""
from __future__ import annotations

import argparse
from collections import defaultdict
import hashlib
import json
from pathlib import Path

import shapefile
from pyproj import CRS, Transformer
from shapely.geometry import LineString, MultiLineString, mapping
from shapely.ops import linemerge, transform


def prepare(source_directory: Path, output: Path) -> None:
    path = next(source_directory.glob("RR1826-1911Modified103123.shp"))
    reader = shapefile.Reader(str(path))
    projection = CRS.from_wkt(path.with_suffix(".prj").read_text())
    to_lonlat = Transformer.from_crs(projection, 4326, always_xy=True).transform
    groups: dict[tuple, list] = defaultdict(list)
    feature_counts: dict[tuple, int] = defaultdict(int)
    for row in reader.iterShapeRecords():
        fields = row.record.as_dict()
        exact, attested = int(fields["ExactDate"] or 0), int(fields["InOpBy"])
        start = exact or attested
        if not 1826 <= start <= 1934:
            raise ValueError(f"Unexpected date in historical archive: {start}")
        key = (start, bool(exact), fields["RRname"].strip(), fields["STATENAM"].strip())
        part_indices = list(row.shape.parts) + [len(row.shape.points)]
        for i, j in zip(part_indices, part_indices[1:]):
            points = row.shape.points[i:j]
            if len(points) >= 2:
                groups[key].append(LineString(points))
        feature_counts[key] += 1

    segments = []
    for key, lines in sorted(groups.items()):
        start, exact, railroad, state = key
        merged = linemerge(MultiLineString(lines))
        geographic = transform(to_lonlat, merged.simplify(250, preserve_topology=True))
        geo = mapping(geographic)

        def rounded(value):
            return [rounded(v) for v in value] if isinstance(value, (list, tuple)) else round(value, 5)

        name = f"{railroad or 'Historical railroad'} — {state or 'United States'}"
        identity = hashlib.sha256(repr(key).encode()).hexdigest()[:12]
        note = (f"Atack ExactDate={start}: sourced opening year." if exact else
                f"Atack InOpBy={start}: attested in operation by this year; usually a source-map year, not an exact opening date.")
        segments.append({
            "id": f"atack-{identity}", "name": name, "start": start,
            "geometry": {"type": geo["type"], "coordinates": rounded(geo["coordinates"])},
            "sourceId": "atack-rail-2023",
            "precision": "Historical reconstructed alignment, simplified at 250 metres in the source Albers projection; five-decimal display coordinates do not imply survey accuracy.",
            "note": note + f" Groups {feature_counts[key]} source features. Accumulated infrastructure evidence only; continued operation, closure and physical survival after the dated evidence are not established."
        })
    source = {
        "id": "atack-rail-2023", "authors": "Jeremy Atack",
        "title": "Historical Geographic Information Systems (GIS) database of U.S. Railroads, 1826–1911 (revised 31 October 2023)",
        "year": 2023, "venue": "Vanderbilt University", "referenceType": "dataset",
        "url": "https://my.vanderbilt.edu/jeremyatack/data-downloads/",
        "access": "Archive and embedded XML inspected 2026-11-15. XML permits free use with attribution. ExactDate is used where nonzero; otherwise InOpBy. Four later bridge/segment attestations in the archive (1912/1916) are retained. Names are generally historical pre-1861 operators, not a complete later company register.",
        "identifier": "RR1826-1911Modified103123.zip"
    }
    payload = {
        "sources": [source], "segments": segments,
        "provenance": {
            "download": "https://cdn.vanderbilt.edu/t2-my/my-prd/wp-content/uploads/sites/133/2024/09/RR1826-1911Modified103123.zip",
            "documentation": "https://cdn.vanderbilt.edu/t2-my/my-prd/wp-content/uploads/sites/133/2021/02/Creating-Historical-Transportation-Shapefiles-RevisedFeb2021.pdf",
            "license": "Free use with source acknowledgment, as stated in archive XML idCredit; not relicensed as project-owned data.",
            "sourceFeatures": len(reader), "displayGroups": len(segments),
            "meaning": "Accumulated built/attested historical infrastructure. No service end or continuous operation is inferred. Source reconstruction combines historic map chronology, historic USGS maps and surviving alignments; this is not an unfiltered modern network.",
            "limitations": "Lower 48 coverage. Most dates are map attestations; some bridges are dated separately or assumed contemporary with connecting track. Source omits most sidings and yards and may contain network gaps. No construction animation between attestations."
        }
    }
    output.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf8")
    print(json.dumps({"sourceFeatures": len(reader), "displayGroups": len(segments), "bytes": output.stat().st_size}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("source_directory", type=Path)
    parser.add_argument("--output", type=Path, default=Path("data/rail-network.json"))
    args = parser.parse_args()
    prepare(args.source_directory, args.output)
