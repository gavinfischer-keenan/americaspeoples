#!/usr/bin/env python3
"""Prepare the public-domain USGS 3DEP 1 m LiDAR glTF 2.0 (.glb) model for Hovenweep.

Downloads USGS_1M_12_x67y414_UT_StatewideCenSouth_2020_A20.tif into the
gitignored work/hovenweep-3d-cache/ directory, verifies its GeoTIFF projection
tags (UTM Zone 12N / EPSG:26912), crops Little Ruin Canyon & Square Tower Group,
triangulates a centered 1:1 metric glTF 2.0 binary (.glb), and prints exact
mesh statistics and structure anchor coordinates.
"""

from __future__ import annotations

import hashlib
import json
import math
import os
import struct
import sys
import urllib.request
import zlib
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
CACHE_DIR = ROOT / "work" / "hovenweep-3d-cache"
OUT_GLB = ROOT / "data" / "site-3d" / "hovenweep-little-ruin-canyon-lidar.glb"

TIFF_SOURCES = [
    (
        "https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/1m/Projects/"
        "UT_StatewideCenSouth_2020_A20/TIFF/"
        "USGS_1M_12_x66y414_UT_StatewideCenSouth_2020_A20.tif",
        CACHE_DIR / "USGS_1M_12_x66y414_UT_StatewideCenSouth_2020_A20.tif",
    ),
    (
        "https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/1m/Projects/"
        "UT_StatewideCenSouth_2020_A20/TIFF/"
        "USGS_1M_12_x67y414_UT_StatewideCenSouth_2020_A20.tif",
        CACHE_DIR / "USGS_1M_12_x67y414_UT_StatewideCenSouth_2020_A20.tif",
    ),
]

STRUCTURES = [
    ("g20-hove-castle-architecture", "Hovenweep Castle", -109.080678, 37.385909),
    ("g20-hove-square-tower-architecture", "Square Tower", -109.081015, 37.385862),
    ("g20-hove-house-architecture", "Hovenweep House", -109.081367, 37.385864),
    ("g20-hove-twin-towers-architecture", "Twin Towers", -109.077001, 37.383169),
    ("g20-hove-unit-type-house-architecture", "Unit Type House", -109.076979, 37.384063),
    ("g20-hove-rim-rock-house-architecture", "Rim Rock House", -109.077507, 37.383310),
    ("g20-hove-tower-point-architecture", "Tower Point", -109.078145, 37.384225),
    ("hovenweep-square-tower", "Square Tower Group (visitor access)", -109.075398, 37.385827),
]


def wgs84_to_utm12n(lon_deg: float, lat_deg: float) -> tuple[float, float]:
    """Convert WGS84 lon/lat (degrees) to UTM Zone 12N (meters)."""
    a = 6378137.0
    f = 1.0 / 298.257223563
    e2 = f * (2.0 - f)
    ep2 = e2 / (1.0 - e2)
    k0 = 0.9996
    lon0 = math.radians(-111.0)  # Zone 12N central meridian
    lat = math.radians(lat_deg)
    lon = math.radians(lon_deg)
    sin_lat = math.sin(lat)
    cos_lat = math.cos(lat)
    tan_lat = math.tan(lat)
    N = a / math.sqrt(1.0 - e2 * sin_lat * sin_lat)
    T = tan_lat * tan_lat
    C = ep2 * cos_lat * cos_lat
    A = cos_lat * (lon - lon0)
    M = a * (
        (1.0 - e2 / 4.0 - 3.0 * e2 * e2 / 64.0 - 5.0 * e2 * e2 * e2 / 256.0) * lat
        - (3.0 * e2 / 8.0 + 3.0 * e2 * e2 / 32.0 + 45.0 * e2 * e2 * e2 / 1024.0) * math.sin(2.0 * lat)
        + (15.0 * e2 * e2 / 256.0 + 45.0 * e2 * e2 * e2 / 1024.0) * math.sin(4.0 * lat)
        - (35.0 * e2 * e2 * e2 / 3072.0) * math.sin(6.0 * lat)
    )
    easting = 500000.0 + k0 * N * (
        A
        + (1.0 - T + C) * (A ** 3) / 6.0
        + (5.0 - 18.0 * T + T * T + 72.0 * C - 58.0 * ep2) * (A ** 5) / 120.0
    )
    northing = k0 * (
        M
        + N * tan_lat * (
            A * A / 2.0
            + (5.0 - T + 9.0 * C + 4.0 * C * C) * (A ** 4) / 24.0
            + (61.0 - 58.0 * T + T * T + 600.0 * C - 330.0 * ep2) * (A ** 6) / 720.0
        )
    )
    return easting, northing


def lzw_decompress_tiff(data: bytes) -> bytes:
    """Decompress TIFF MSB LZW stream (8-bit codes starting at 9 bits)."""
    out = bytearray()
    table = [bytes([i]) for i in range(256)] + [b"", b""]
    code_size = 9
    next_code = 258
    bit_buf = 0
    bit_count = 0
    pos = 0
    length = len(data)

    def next_word() -> int:
        nonlocal bit_buf, bit_count, pos
        while bit_count < code_size:
            if pos >= length:
                return 257
            bit_buf = (bit_buf << 8) | data[pos]
            pos += 1
            bit_count += 8
        bit_count -= code_size
        code = (bit_buf >> bit_count) & ((1 << code_size) - 1)
        bit_buf &= (1 << bit_count) - 1
        return code

    prev = b""
    while True:
        code = next_word()
        if code == 257:
            break
        if code == 256:
            table = [bytes([i]) for i in range(256)] + [b"", b""]
            code_size = 9
            next_code = 258
            prev = b""
            continue
        if code < len(table):
            entry = table[code]
        elif code == next_code and prev:
            entry = prev + prev[:1]
        else:
            raise ValueError(f"Corrupt TIFF LZW stream at code {code}")
        out.extend(entry)
        if prev:
            if next_code < 4096:
                if next_code == len(table):
                    table.append(prev + entry[:1])
                else:
                    table[next_code] = prev + entry[:1]
                next_code += 1
                if next_code == 511 and code_size == 9:
                    code_size = 10
                elif next_code == 1023 and code_size == 10:
                    code_size = 11
                elif next_code == 2047 and code_size == 11:
                    code_size = 12
        prev = entry
    return bytes(out)


def read_geotiff_float32(path: Path) -> tuple[np.ndarray, tuple[float, float, float, float], dict]:
    """Read a float32 GeoTIFF (striped or tiled, uncompressed/DEFLATE/LZW)."""
    raw = path.read_bytes()
    endian = "<" if raw[:2] == b"II" else ">" if raw[:2] == b"MM" else None
    if endian is None:
        raise ValueError("Not a valid TIFF file")
    magic, ifd_offset = struct.unpack_from(endian + "HI", raw, 2)
    if magic != 42:
        raise ValueError(f"Unsupported TIFF magic {magic} (BigTIFF not expected)")

    type_sizes = {1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8}
    type_fmts = {1: "B", 3: "H", 4: "I", 6: "b", 8: "h", 9: "i", 11: "f", 12: "d"}

    n_entries = struct.unpack_from(endian + "H", raw, ifd_offset)[0]
    tags: dict[int, object] = {}
    for i in range(n_entries):
        tag, typ, count, val_off = struct.unpack_from(endian + "HHII", raw, ifd_offset + 2 + i * 12)
        sz = type_sizes.get(typ, 1) * count
        if sz <= 4:
            buf = raw[ifd_offset + 2 + i * 12 + 8 : ifd_offset + 2 + i * 12 + 12]
        else:
            buf = raw[val_off : val_off + sz]
        if typ == 2:
            tags[tag] = buf.rstrip(b"\x00").decode("latin1", errors="replace")
        elif typ in type_fmts:
            vals = struct.unpack_from(endian + str(count) + type_fmts[typ], buf, 0)
            tags[tag] = vals[0] if count == 1 else list(vals)

    width = int(tags[256])
    height = int(tags[257])
    bps = tags.get(258, 32)
    compression = int(tags.get(259, 1))
    sample_format = int(tags.get(339, 3))
    predictor = int(tags.get(317, 1))
    if bps != 32 or sample_format != 3:
        raise ValueError(f"Expected 32-bit float GeoTIFF, got bps={bps}, sample_format={sample_format}")

    pixel_scale = tags[33550]  # [sx, sy, sz]
    tiepoint = tags[33922]  # [i, j, k, x, y, z]
    sx, sy = float(pixel_scale[0]), float(pixel_scale[1])
    x0 = float(tiepoint[3]) - float(tiepoint[0]) * sx
    y0 = float(tiepoint[4]) + float(tiepoint[1]) * sy

    def decode_block(comp_bytes: bytes, rows: int, cols: int) -> np.ndarray:
        if compression == 1:
            dec = comp_bytes
        elif compression in (8, 32946):
            dec = zlib.decompress(comp_bytes)
        elif compression == 5:
            dec = lzw_decompress_tiff(comp_bytes)
        else:
            raise ValueError(f"Unsupported TIFF compression {compression}")
        arr = np.frombuffer(dec, dtype=np.dtype(endian + "f4")).reshape((rows, cols)).copy()
        if predictor == 3:
            # Floating-point horizontal differencing predictor (TIFF Tech Note 3):
            # byte-differenced per row, with the 4 IEEE-754 float32 byte planes
            # stored MSB-to-LSB as (rows, 4, cols).
            u8 = np.frombuffer(dec, dtype=np.uint8).reshape((rows, cols * 4)).copy()
            u8 = np.cumsum(u8, axis=1, dtype=np.uint8)
            planes = u8.reshape((rows, 4, cols)).transpose(0, 2, 1)
            if endian == "<":
                planes = planes[:, :, ::-1]
            arr = np.frombuffer(planes.tobytes(), dtype=np.dtype(endian + "f4")).reshape((rows, cols)).copy()
        elif predictor == 2:
            u8 = np.frombuffer(dec, dtype=np.uint8).reshape((rows, cols * 4)).copy()
            u8 = np.cumsum(u8, axis=1, dtype=np.uint8)
            arr = np.frombuffer(u8.tobytes(), dtype=np.dtype(endian + "f4")).reshape((rows, cols)).copy()
        return arr

    dem = np.empty((height, width), dtype=np.float32)
    if 273 in tags:  # Striped
        offsets = tags[273] if isinstance(tags[273], list) else [tags[273]]
        counts = tags[279] if isinstance(tags[279], list) else [tags[279]]
        rps = int(tags.get(278, height))
        row = 0
        for off, cnt in zip(offsets, counts):
            rows_here = min(rps, height - row)
            dem[row : row + rows_here, :] = decode_block(raw[off : off + cnt], rows_here, width)
            row += rows_here
    elif 324 in tags:  # Tiled
        tw = int(tags[322])
        th = int(tags[323])
        offsets = tags[324]
        counts = tags[325]
        tiles_x = math.ceil(width / tw)
        tiles_y = math.ceil(height / th)
        idx = 0
        for ty in range(tiles_y):
            y_start = ty * th
            y_end = min(height, y_start + th)
            for tx in range(tiles_x):
                x_start = tx * tw
                x_end = min(width, x_start + tw)
                tile = decode_block(raw[offsets[idx] : offsets[idx] + counts[idx]], th, tw)
                dem[y_start:y_end, x_start:x_end] = tile[: y_end - y_start, : x_end - x_start]
                idx += 1
    else:
        raise ValueError("TIFF has neither strips nor tiles")

    return dem, (x0, y0, sx, sy), {
        "width": width,
        "height": height,
        "compression": compression,
        "predictor": predictor,
        "geokeys": tags.get(34735),
        "nodata": tags.get(42113),
    }


def download_if_needed(url: str, path: Path) -> str:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    if not path.exists() or path.stat().st_size < 10_000_000:
        print(f"Downloading {url} ...")
        req = urllib.request.Request(url, headers={"User-Agent": "AmericasPeoplesBuild/1.0"})
        with urllib.request.urlopen(req, timeout=180) as resp, path.open("wb") as out:
            while chunk := resp.read(1024 * 256):
                out.write(chunk)
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def build_glb(
    grid: np.ndarray,
    x_coords: np.ndarray,
    z_coords: np.ndarray,
    mean_y: float,
    out_path: Path,
) -> tuple[int, int, dict]:
    """Triangulate regular grid into a centered Y-up glTF 2.0 binary (.glb)."""
    rows, cols = grid.shape
    xx, zz = np.meshgrid(x_coords, z_coords)
    yy = grid.astype(np.float32) - np.float32(mean_y)

    positions = np.stack([xx, yy, zz], axis=-1).reshape(-1, 3).astype(np.float32)

    # Smooth finite-difference normals on metric grid
    dx = float(abs(x_coords[1] - x_coords[0]))
    dz = float(abs(z_coords[1] - z_coords[0]))
    dydx = np.gradient(yy, dx, axis=1)
    dydz = np.gradient(yy, dz, axis=0)
    # Surface tangents: (1, dydx, 0) and (0, dydz, 1) -> cross((0, dydz, 1), (1, dydx, 0)) = (-dydx, 1, -dydz)
    nx = -dydx
    ny = np.ones_like(yy)
    nz = -dydz
    norm_len = np.sqrt(nx * nx + ny * ny + nz * nz)
    normals = np.stack([nx / norm_len, ny / norm_len, nz / norm_len], axis=-1).reshape(-1, 3).astype(np.float32)

    # Hypsometric + slope vertex color (Dakota sandstone rim to canyon wash)
    y_min = float(yy.min())
    y_max = float(yy.max())
    t = np.clip((yy - y_min) / max(1e-6, y_max - y_min), 0.0, 1.0)
    slope = np.clip(1.0 - ny / norm_len, 0.0, 1.0)
    # Canyon bottom (#8d6e52) -> mid-talus (#be9364) -> mesa rim (#dfc596), darkened slightly on steep ledges
    r = (141 + 82 * t - 42 * slope).clip(45, 245).astype(np.uint8)
    g = (110 + 87 * t - 38 * slope).clip(38, 232).astype(np.uint8)
    b = (82 + 68 * t - 32 * slope).clip(30, 195).astype(np.uint8)
    colors = np.stack([r, g, b], axis=-1).reshape(-1, 3)

    # Triangle indices (CCW when viewed from +Y)
    r_idx = np.arange(rows - 1, dtype=np.uint32)[:, None]
    c_idx = np.arange(cols - 1, dtype=np.uint32)[None, :]
    v00 = r_idx * cols + c_idx
    v10 = v00 + 1
    v01 = (r_idx + 1) * cols + c_idx
    v11 = v01 + 1
    # Note: z_coords increases southward (+Z), x_coords increases eastward (+X).
    # From +Y looking down (-Y): +X is right, +Z is down.
    # CCW triangle in screen (X right, Z down): v00 -> v01 -> v10, and v10 -> v01 -> v11
    t1 = np.stack([v00, v01, v10], axis=-1)
    t2 = np.stack([v10, v01, v11], axis=-1)
    indices = np.concatenate([t1.reshape(-1, 3), t2.reshape(-1, 3)], axis=0).reshape(-1).astype(np.uint32)

    pos_bytes = positions.tobytes()
    norm_bytes = normals.tobytes()
    col_bytes = colors.tobytes()
    # Pad color buffer to 4-byte boundary before uint32 indices
    col_pad = (4 - (len(col_bytes) % 4)) % 4
    idx_bytes = indices.tobytes()

    bin_blob = pos_bytes + norm_bytes + col_bytes + (b"\x00" * col_pad) + idx_bytes
    bin_pad = (4 - (len(bin_blob) % 4)) % 4
    bin_blob += b"\x00" * bin_pad

    off_pos = 0
    off_norm = off_pos + len(pos_bytes)
    off_col = off_norm + len(norm_bytes)
    off_idx = off_col + len(col_bytes) + col_pad

    pos_min = [float(v) for v in positions.min(axis=0)]
    pos_max = [float(v) for v in positions.max(axis=0)]

    gltf = {
        "asset": {
            "version": "2.0",
            "generator": "Americas Peoples prepare-hovenweep-3d.py (USGS 3DEP 1m LiDAR)",
            "copyright": "Public Domain (U.S. Geological Survey — 3D Elevation Program)",
        },
        "scene": 0,
        "scenes": [{"name": "Little Ruin Canyon", "nodes": [0]}],
        "nodes": [{"name": "Little Ruin Canyon 1m LiDAR Surface", "mesh": 0}],
        "meshes": [
            {
                "name": "Little Ruin Canyon",
                "primitives": [
                    {
                        "attributes": {"POSITION": 0, "NORMAL": 1, "COLOR_0": 2},
                        "indices": 3,
                        "material": 0,
                    }
                ],
            }
        ],
        "materials": [
            {
                "name": "Bare-earth LiDAR surface",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [1.0, 1.0, 1.0, 1.0],
                    "metallicFactor": 0.0,
                    "roughnessFactor": 0.92,
                },
                "doubleSided": False,
            }
        ],
        "buffers": [{"byteLength": len(bin_blob)}],
        "bufferViews": [
            {"buffer": 0, "byteOffset": off_pos, "byteLength": len(pos_bytes), "target": 34962},
            {"buffer": 0, "byteOffset": off_norm, "byteLength": len(norm_bytes), "target": 34962},
            {"buffer": 0, "byteOffset": off_col, "byteLength": len(col_bytes), "target": 34962},
            {"buffer": 0, "byteOffset": off_idx, "byteLength": len(idx_bytes), "target": 34963},
        ],
        "accessors": [
            {
                "bufferView": 0,
                "componentType": 5126,
                "count": len(positions),
                "type": "VEC3",
                "min": pos_min,
                "max": pos_max,
            },
            {
                "bufferView": 1,
                "componentType": 5126,
                "count": len(normals),
                "type": "VEC3",
            },
            {
                "bufferView": 2,
                "componentType": 5121,
                "normalized": True,
                "count": len(colors),
                "type": "VEC3",
            },
            {
                "bufferView": 3,
                "componentType": 5125,
                "count": len(indices),
                "type": "SCALAR",
            },
        ],
    }
    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    json_pad = (4 - (len(json_bytes) % 4)) % 4
    json_bytes += b" " * json_pad

    total_len = 12 + 8 + len(json_bytes) + 8 + len(bin_blob)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total_len))
        f.write(struct.pack("<II", len(json_bytes), 0x4E4F534A))
        f.write(json_bytes)
        f.write(struct.pack("<II", len(bin_blob), 0x004E4942))
        f.write(bin_blob)

    return len(positions), len(indices) // 3, {"min": pos_min, "max": pos_max}


def main() -> None:
    utm_pts = [(rid, label, *wgs84_to_utm12n(lon, lat)) for rid, label, lon, lat in STRUCTURES]
    es = [p[2] for p in utm_pts]
    ns = [p[3] for p in utm_pts]
    pad_m = 110.0
    min_e = math.floor(min(es) - pad_m)
    max_e = math.ceil(max(es) + pad_m)
    min_n = math.floor(min(ns) - pad_m)
    max_n = math.ceil(max(ns) + pad_m)

    cols_total = int(max_e - min_e)
    rows_total = int(max_n - min_n)
    mosaic = np.full((rows_total, cols_total), np.nan, dtype=np.float32)

    for url, path in TIFF_SOURCES:
        tiff_sha = download_if_needed(url, path)
        print(f"Source TIFF {path.name} SHA-256: {tiff_sha}")
        dem, (x0, y0, sx, sy), meta = read_geotiff_float32(path)
        print(f"  metadata: {meta['width']}x{meta['height']} origin=({x0:.2f}, {y0:.2f}) pixel={sx}x{sy} m")
        if abs(sx - 1.0) > 1e-6 or abs(sy - 1.0) > 1e-6:
            raise ValueError(f"Expected 1 m pixel scale, got {sx}x{sy}")
        # Overlap in world UTM coordinates
        ov_min_e = max(min_e, x0)
        ov_max_e = min(max_e, x0 + dem.shape[1] * sx)
        ov_min_n = max(min_n, y0 - dem.shape[0] * sy)
        ov_max_n = min(max_n, y0)
        if ov_min_e >= ov_max_e or ov_min_n >= ov_max_n:
            continue
        sc0 = int(round((ov_min_e - x0) / sx))
        sc1 = int(round((ov_max_e - x0) / sx))
        sr0 = int(round((y0 - ov_max_n) / sy))
        sr1 = int(round((y0 - ov_min_n) / sy))
        dc0 = int(round(ov_min_e - min_e))
        dr0 = int(round(max_n - ov_max_n))
        patch = dem[sr0:sr1, sc0:sc1]
        valid = np.isfinite(patch) & (patch > 500.0) & (patch < 4000.0)
        dst = mosaic[dr0 : dr0 + patch.shape[0], dc0 : dc0 + patch.shape[1]]
        mosaic[dr0 : dr0 + patch.shape[0], dc0 : dc0 + patch.shape[1]] = np.where(valid, patch, dst)

    if np.isnan(mosaic).any():
        missing = int(np.isnan(mosaic).sum())
        print(f"Filling {missing} edge/nodata pixels with median elevation")
        fill = float(np.nanmedian(mosaic))
        mosaic = np.where(np.isnan(mosaic), fill, mosaic)

    print(
        f"Stitched 1m window: {mosaic.shape[1]}x{mosaic.shape[0]} m "
        f"(UTM12N E {min_e}..{max_e}, N {min_n}..{max_n}), "
        f"elev {mosaic.min():.2f}..{mosaic.max():.2f} m"
    )

    # Downsample by 3m step for compact web-ready glTF (~52k vertices, ~103k triangles, ~2 MB)
    step = 3
    sub = mosaic[::step, ::step]
    e_centers = min_e + (np.arange(0, cols_total, step) + 0.5)
    n_centers = max_n - (np.arange(0, rows_total, step) + 0.5)

    center_e = float(0.5 * (e_centers[0] + e_centers[-1]))
    center_n = float(0.5 * (n_centers[0] + n_centers[-1]))
    mean_y = float(sub.mean())

    x_local = (e_centers - center_e).astype(np.float32)
    z_local = (center_n - n_centers).astype(np.float32)  # North is -Z, South is +Z

    verts, tris, bounds = build_glb(sub, x_local, z_local, mean_y, OUT_GLB)
    glb_bytes = OUT_GLB.read_bytes()
    glb_sha = hashlib.sha256(glb_bytes).hexdigest()
    print(f"Wrote {OUT_GLB}: {len(glb_bytes)} bytes, SHA-256={glb_sha}")
    print(f"Mesh: {verts} vertices, {tris} triangles, bounds={json.dumps(bounds)}")

    print("\nStructure local coordinates [x, y, z] (1m DEM surface + 4m marker):")
    for rid, label, e, n in utm_pts:
        col_i = int(np.clip(round(e - min_e - 0.5), 0, mosaic.shape[1] - 1))
        row_i = int(np.clip(round(max_n - n - 0.5), 0, mosaic.shape[0] - 1))
        elev = float(mosaic[row_i, col_i])
        lx = round(e - center_e, 2)
        ly = round(elev - mean_y + 4.0, 2)
        lz = round(center_n - n, 2)
        print(f"  {rid:40s} | {label:34s} | [{lx:7.2f}, {ly:6.2f}, {lz:7.2f}] | elev={elev:.2f}m")


if __name__ == "__main__":
    main()
