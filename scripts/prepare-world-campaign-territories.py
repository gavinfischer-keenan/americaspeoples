"""Prepare licensed Cliopatria campaign-study territory versions from pinned data.

No downloads, inferred frontiers, modern-border clipping or point hulls. Requires
the existing Shapely environment; --python-libs may name its local cache.
"""
import argparse
import hashlib
import json
import sys
import zipfile
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source-dir', type=Path, required=True)
parser.add_argument('--python-libs', type=Path)
parser.add_argument('--catalogue', type=Path, default=Path(__file__).resolve().parents[1] / 'data/world/campaigns.json')
args = parser.parse_args()
if args.python_libs:
    sys.path.insert(0, str(args.python_libs.resolve()))
from shapely import make_valid
from shapely.geometry import shape, mapping, MultiPolygon
from shapely.geometry.polygon import orient

DIGEST = 'e10a4e429fca708788ff9e7572a95fce801fae55852d217cffabc1c59cd4eed4'
archive = args.source_dir / 'cliopatria.geojson.zip'
if hashlib.sha256(archive.read_bytes()).hexdigest() != DIGEST:
    raise ValueError('Unexpected Cliopatria edition: review changed source data first')
if 'Creative Commons Attribution 4.0' not in (args.source_dir / 'LICENSE.md').read_text(encoding='utf-8'):
    raise ValueError('Expected original CC BY 4.0 source licence')
with zipfile.ZipFile(archive) as z:
    data = json.loads(z.read(next(n for n in z.namelist() if n.endswith('.geojson'))))


def components(geometry):
    if geometry.geom_type == 'Polygon':
        yield geometry
    elif hasattr(geometry, 'geoms'):
        for child in geometry.geoms:
            yield from components(child)


def rounded(value):
    if isinstance(value, (tuple, list)):
        return [rounded(item) for item in value]
    return round(value, 5)


def astronomical(year):
    # Cliopatria README defines negative source years as BCE, not astronomical.
    return year + 1 if year < 0 else year


territories = []
expected_mongol = {5272, 5364, 5430, 5466}
expected_carthage = {679, 733, 735, 746, 758, 767, 800, 817, 823}
for index, feature in enumerate(data['features']):
    p = feature['properties']
    if p['Type'] != 'POLITY':
        continue
    if index in expected_mongol:
        assert p['Name'] == 'Mongol Empire' and 1206 <= p['FromYear'] <= p['ToYear'] <= 1226
        study, first, last = 'genghis', p['FromYear'], p['ToYear']
        regions = ['asia-pacific']
        title = 'Mongol Empire: source reconstruction'
    elif index in expected_carthage:
        assert p['Name'] == 'Carthage'
        study, first, last = 'hannibal', max(-219, p['FromYear']), min(-202, p['ToYear'])
        regions = ['europe', 'africa']
        title = 'Carthage: source polity reconstruction'
    else:
        continue
    geometry = shape(feature['geometry'])
    if not geometry.is_valid:
        geometry = make_valid(geometry)
    polygons = [orient(part, sign=-1) for part in components(geometry.simplify(0.08, preserve_topology=True))]
    if not polygons:
        raise ValueError(f'No polygon survives for source row {index}')
    prepared = polygons[0] if len(polygons) == 1 else MultiPolygon(polygons)
    coordinates = rounded(mapping(prepared)['coordinates'])
    check = shape(dict(type=prepared.geom_type, coordinates=coordinates))
    if not check.is_valid or check.is_empty:
        raise ValueError(f'Invalid rounded geometry for source row {index}')
    limits = (f'Cliopatria row {index}, {p["Name"]}, original signed BCE/CE window {p["FromYear"]} to {p["ToYear"]}. '
              'Approximate historical-atlas polity reconstruction, not surveyed control or an annual conquest sequence. '
              'Source intervals may combine several changes; dated campaign points provide finer event chronology. '
              'Whole source geometry retained, simplified at 0.08 degrees and rounded to five decimals; rings oriented for D3. '
              'No frontier was inferred from routes or modern borders. CC BY 4.0 source and derivative: '
              'Bennett et al. / Seshat, https://creativecommons.org/licenses/by/4.0/. ')
    if study == 'genghis':
        limits += 'The following 1227–1235 source outline is omitted because it spans successor conquests and cannot establish Chinggis Khan’s frontier at death.'
    else:
        limits += 'This represents the Carthaginian polity, not land personally occupied by Hannibal or a uniform administration of allied Italian cities. The last interval may combine battle and subsequent treaty changes.'
    territories.append(dict(id=f'{study}-territory-{index}', title=title,
                            start=astronomical(first), end=astronomical(last),
                            geometry=dict(type=prepared.geom_type, coordinates=coordinates),
                            meaning='approximate-control', limits=limits,
                            sourceIds=['campaign-cliopatria', 'campaign-cliopatria-methods'], regionIds=regions))
assert len(territories) == 13, 'Pinned edition selections unexpectedly changed'
catalogue = json.loads(args.catalogue.read_text(encoding='utf-8'))
catalogue['territories'] = territories
for study in catalogue['studies']:
    prefix = 'genghis-' if study['id'] == 'genghis-khan' else 'hannibal-'
    study['territoryIds'] = [t['id'] for t in territories if t['id'].startswith(prefix)]
args.catalogue.write_text(json.dumps(catalogue, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Prepared {len(territories)} validated, licensed territory versions in {args.catalogue}')
