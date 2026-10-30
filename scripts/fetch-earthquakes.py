"""Freeze NOAA/NCEI Significant Earthquake API pages and merge the atlas subset.

Run python scripts/fetch-earthquakes.py to fetch missing pages; --offline rebuilds
from archived bytes without network access. Uses only the Python standard library.
Delete the earthquake raw pages deliberately before requesting a fresh catalog.
The unrelated volcano, tsunami, ENSO and ice archives are never downloaded here.
"""
import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
API = 'https://www.ngdc.noaa.gov/hazel/hazard-service/api/v1/earthquakes'
DOI = 'https://doi.org/10.7289/V5TD9V7K'
DOCUMENTATION = 'https://www.ncei.noaa.gov/products/natural-hazards/tsunamis-earthquakes-volcanoes/earthquakes'
LIMITATIONS = ('Catalog epicenter only, not a shaking footprint or affected settlement. '
               'Historical dates, locations and magnitudes can be uncertain; missing uncertainty '
               'fields do not establish precision. Original source fields and publication status '
               'are retained. This selective significant-event catalog is not an exhaustive '
               'earthquake history; completeness varies by region and period. Source casualty '
               'or damage fields describe the catalog event and are not assigned to atlas sites. '
               'No settlement impact is inferred.')


def astronomical_year(year):
    # Historical BCE/CE has no year zero; atlas astronomical 0 means 1 BCE.
    if not isinstance(year, int) or isinstance(year, bool) or year == 0:
        raise ValueError('Expected nonzero historical BCE/CE integer year')
    return year + 1 if year < 0 else year


def in_scope(lon, lat):
    # Identical editorial envelope to fetch-physical-context.py.
    return ((-170 <= lon <= -30 and -60 <= lat <= 85)
            or ((lon >= 120 or lon <= -140) and -25 <= lat <= 70)
            or (95 <= lon < 120 and -12 <= lat <= 25))


def select_events(rows):
    seen = {}
    events = []
    for row in rows:
        identity = row['id']
        if identity in seen:
            if seen[identity] != row:
                raise ValueError(f'Conflicting earthquake catalog rows for id {identity}')
            continue
        seen[identity] = row
        year, lon, lat = row.get('year'), row.get('longitude'), row.get('latitude')
        if year is None or year > 1934 or lon is None or lat is None or not in_scope(lon, lat):
            continue
        converted = astronomical_year(year)
        # This API exposes publication status, not a tsunami-style validity score.
        status = 'Published catalog entry' if row.get('publish') is True else 'Unspecified publication status'
        if any('uncertainty' in key.lower() and value for key, value in row.items()):
            status += '; source uncertainty reported'
        events.append({'id': f'noaa-earthquake-{identity}', 'kind': 'earthquake',
                       'title': row.get('locationName') or 'Significant earthquake epicenter',
                       'start': converted, 'end': converted, 'coordinates': [lon, lat],
                       'sourceId': 'noaa-earthquake', 'status': status,
                       'detail': {**row, 'yearAsReported': year}, 'limitations': LIMITATIONS,
                       'url': 'https://www.ngdc.noaa.gov/hazel/view/hazards/earthquake/event-more-info/' + str(identity)})
    return events


def freeze(root=ROOT, offline=False):
    archive = root / 'data/physical-sources'
    archive.mkdir(parents=True, exist_ok=True)
    manifest_path = archive / 'fetch-manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    previous = {entry['file']: entry for entry in manifest}
    fetched = []

    def page(number):
        name = 'noaa-earthquakes.json' if number == 1 else f'noaa-earthquakes-page{number}.json'
        path = archive / name
        params = {'itemsPerPage': 200, 'page': number}
        if not path.exists():
            if offline:
                raise FileNotFoundError(f'Offline archive is missing {name}')
            with urlopen(API + '?' + urlencode(params), timeout=180) as response:
                raw = response.read()
            path.write_bytes(raw)
            retrieved = datetime.now(timezone.utc).date().isoformat()
        else:
            raw = path.read_bytes()
            if name not in previous:
                raise ValueError(f'Cached {name} has no retrieval provenance')
            retrieved = previous[name]['retrieved']
            if hashlib.sha256(raw).hexdigest() != previous[name]['sha256']:
                raise ValueError(f'Checksum mismatch for {name}')
        entry = {'file': name, 'url': API, 'parameters': params, 'retrieved': retrieved,
                 'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw)}
        fetched.append(entry)
        # Keep progress recoverable without inventing retrieval dates on a retry.
        merged = [e for e in manifest if e['file'] not in {f['file'] for f in fetched}]
        manifest_path.write_text(json.dumps(merged + fetched, indent=2) + '\n', encoding='utf-8')
        data = json.loads(raw)
        if data.get('page') != number or not isinstance(data.get('items'), list):
            raise ValueError(f'Unexpected catalog page {number}')
        return data

    first = page(1)
    rows = list(first['items'])
    for number in range(2, first['totalPages'] + 1):
        data = page(number)
        if (data['totalItems'], data['totalPages']) != (first['totalItems'], first['totalPages']):
            raise ValueError('Catalog changed during pagination; do not publish a partial freeze')
        rows.extend(data['items'])
    if len({row['id'] for row in rows}) != first['totalItems']:
        raise ValueError('Unique catalog row count does not match API totalItems')
    selected = select_events(rows)
    event_path = root / 'data/hazard-events.json'
    catalog = json.loads(event_path.read_text(encoding='utf-8'))
    catalog['events'] = [e for e in catalog['events'] if e['sourceId'] != 'noaa-earthquake'] + selected
    event_path.write_text(json.dumps(catalog, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    summary = {'sourceId': 'noaa-earthquake', 'doi': DOI, 'documentation': DOCUMENTATION,
               'api': API, 'catalogRows': first['totalItems'], 'archivedPages': first['totalPages'],
               'selectedEvents': len(selected), 'scope': catalog['scope'],
               'method': 'Deduplicate exact catalog IDs; reject conflicting duplicates. Preserve original rows. '
                         'Historical negative BCE years become astronomical year+1 (1 BCE = 0); '
                         'no historical year zero is accepted. Source year <=1934; same geographic '
                         'envelope as existing hazards. No inferred date intervals or settlement impacts.',
               'limitations': LIMITATIONS}
    (archive / 'noaa-earthquake-import.json').write_text(json.dumps(summary, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--offline', action='store_true')
    freeze(offline=parser.parse_args().offline)
