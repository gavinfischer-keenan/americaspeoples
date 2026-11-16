import tempfile, unittest
from pathlib import Path
from release_retention import plan_retention, apply_retention

class RetentionSafety(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        root=Path(self.temp.name);self.api=root/'api';self.web=root/'web'
        self.ids=['20260101T000000Z-americas-v0.9.0','20260201T000000Z-americas-v0.10.0','20260301T000000Z-americas-v0.11.0']
        for base in [self.api,self.web]:(base/'releases').mkdir(parents=True)
        (self.api/'backups').mkdir()
        for ident in self.ids:
            api=self.api/'releases'/ident;web=self.web/'releases'/ident
            (api/'data').mkdir(parents=True);(api/'data/atlas.sqlite3').write_text(ident)
            (api/'server').mkdir();(api/'server/app.py').write_text('app')
            for rel in ['americaspeoples-app','free-utilities/americaspeoples','downloads/americaspeoples']:(web/rel).mkdir(parents=True)
            (web/'americaspeoples-app/app.js').write_text('atlas')
            (web/'unrelated.txt').write_text('other site')
            for version in ['v0.9.0','v0.10.0','v0.11.0']:(web/'downloads/americaspeoples'/version).mkdir()
        self.current_api=self.api/'releases'/self.ids[2];self.previous_api=self.api/'releases'/self.ids[1]
        self.current_web=self.web/'releases'/self.ids[2];self.previous_web=self.web/'releases'/self.ids[1]
        try:
            (self.api/'current').symlink_to(self.current_api,target_is_directory=True)
            (self.web/'current').symlink_to(self.current_web,target_is_directory=True)
        except OSError as e:self.skipTest('Directory symlinks unavailable: '+str(e))
        self.backup=self.api/'backups'/(self.ids[2]+'-previous.sqlite3');self.backup.write_text(self.ids[1])
        (self.api/'backups/atlas-20260101T000000Z.sqlite3').write_text('obsolete')
        self.receipt=dict(id=self.ids[2],static=str(self.current_web),api=str(self.current_api),rollbackStatic=str(self.previous_web),rollbackApi=str(self.previous_api),previousVersion='0.10.0',health=dict(version='0.11.0'))

    def test_keeps_current_and_one_previous_pair_and_download_versions(self):
        plan=plan_retention(self.api,self.web,self.receipt);apply_retention(plan)
        self.assertEqual(sorted(p.name for p in (self.api/'releases').iterdir()),self.ids[1:])
        for web in [self.current_web,self.previous_web]:
            self.assertTrue((web/'americaspeoples-app/app.js').is_file())
            self.assertEqual(sorted(p.name for p in (web/'downloads/americaspeoples').iterdir()),['v0.10.0','v0.11.0'])
        self.assertEqual(list((self.api/'backups').iterdir()),[self.backup])
        self.assertEqual(plan_retention(self.api,self.web,self.receipt),[])

    def test_old_shared_snapshot_loses_only_atlas_components(self):
        apply_retention(plan_retention(self.api,self.web,self.receipt))
        old=self.web/'releases'/self.ids[0]
        self.assertEqual((old/'unrelated.txt').read_text(),'other site')
        self.assertFalse((old/'americaspeoples-app').exists())

    def test_changed_current_or_missing_rollback_refuses_plan(self):
        self.receipt['api']=str(self.previous_api)
        with self.assertRaises(ValueError):plan_retention(self.api,self.web,self.receipt)
        self.receipt['api']=str(self.current_api);(self.previous_api/'data/atlas.sqlite3').unlink()
        with self.assertRaises(ValueError):plan_retention(self.api,self.web,self.receipt)

    def test_symlinked_old_release_refuses_cleanup(self):
        outside=Path(self.temp.name)/'outside';outside.mkdir();(outside/'keep').write_text('safe')
        (self.api/'releases/20251201T000000Z').symlink_to(outside,target_is_directory=True)
        with self.assertRaises(ValueError):plan_retention(self.api,self.web,self.receipt)
        self.assertTrue((outside/'keep').is_file())

    def test_wrong_previous_database_backup_refuses_cleanup(self):
        self.backup.write_text('wrong release')
        with self.assertRaises(ValueError):plan_retention(self.api,self.web,self.receipt)

if __name__=='__main__':unittest.main()
