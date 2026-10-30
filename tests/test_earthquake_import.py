import importlib.util
import unittest
from pathlib import Path

SCRIPT = Path(__file__).parents[1] / 'scripts/fetch-earthquakes.py'

class EarthquakeImportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if SCRIPT.exists():
            spec = importlib.util.spec_from_file_location('earthquakes', SCRIPT)
            cls.importer = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(cls.importer)
        else:
            cls.importer = None

    def test_historical_years_convert_without_inventing_year_zero(self):
        self.assertIsNotNone(self.importer, 'standalone earthquake importer required')
        for original, astronomical in [(-2150, -2149), (-2, -1), (-1, 0), (1, 1), (1934, 1934)]:
            self.assertEqual(self.importer.astronomical_year(original), astronomical)
        with self.assertRaises(ValueError):
            self.importer.astronomical_year(0)

    def test_scope_cutoff_and_id_dedup_preserve_distinct_events(self):
        self.assertIsNotNone(self.importer, 'standalone earthquake importer required')
        base = {'id': 1, 'year': 1934, 'longitude': -75, 'latitude': -10, 'publish': True}
        rows = [base, dict(base), {**base, 'id': 2}, {**base, 'id': 3, 'year': 1935},
                {**base, 'id': 4, 'longitude': 35}, {**base, 'id': 5, 'latitude': None},
                {**base, 'id': 6, 'longitude': 140, 'latitude': 35},
                {**base, 'id': 7, 'longitude': 110, 'latitude': 0}]
        self.assertEqual([e['id'] for e in self.importer.select_events(rows)],
                         ['noaa-earthquake-1', 'noaa-earthquake-2', 'noaa-earthquake-6', 'noaa-earthquake-7'])
        with self.assertRaises(ValueError):
            self.importer.select_events([base, {**base, 'latitude': -11}])

    def test_official_dates_coordinates_and_status_survive_without_local_impact(self):
        self.assertIsNotNone(self.importer, 'standalone earthquake importer required')
        row = {'id': 9, 'year': -1, 'month': 10, 'day': 2, 'longitude': 140.2,
               'latitude': 35.1, 'locationName': 'Source location', 'publish': True,
               'dateUncertainty': 'Historical date uncertain', 'eqMagnitude': 7.8, 'deaths': 10}
        event = self.importer.select_events([row])[0]
        self.assertEqual((event['start'], event['end']), (0, 0))
        self.assertEqual(event['coordinates'], [140.2, 35.1])
        self.assertEqual(event['detail']['yearAsReported'], -1)
        for key, value in row.items():
            self.assertEqual(event['detail'][key], value)
        self.assertIn('uncertain', event['status'].lower())
        self.assertIn('No settlement impact is inferred', event['limitations'])
        self.assertNotIn('settlementId', event)
        self.assertNotIn('affectedSites', event)

if __name__ == '__main__':
    unittest.main()
