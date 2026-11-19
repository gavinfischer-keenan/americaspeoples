import importlib.util
from pathlib import Path
import unittest
import copy,csv,json,tempfile

spec=importlib.util.spec_from_file_location('shipwreck_import',Path(__file__).with_name('import-shipwrecks.py'))
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class WreckImportTests(unittest.TestCase):
    def ireland_records(self,dates):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'ireland-wiid-all.csv'
            fields=['Wreck No','Date of Loss','Date_of_Loss_Year_Only','Wreck Name','Classification','DD_Lat','DD_Long','Place of Loss']
            with path.open('w',newline='',encoding='utf-8') as f:
                writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader()
                for i,(raw,year) in enumerate(dates):writer.writerow(dict(zip(fields,[str(i),raw,year,'Vessel '+str(i),'ship','53','-10','Irish coast'])))
            return module.regional(Path(folder),'ireland')[0]
    def test_irish_ranges_and_circa_dates_preserve_uncertainty(self):
        records=self.ireland_records([('Between 1/1/1700 and 31/12/1900','1900'),('circa. 1750-1825','1825'),('circa 1/1/1550','1550'),('Between 1/1/1847 and 31/12/1847','1847')])
        self.assertEqual((records[0]['time']['start'],records[0]['time']['end']),(1700,1900))
        self.assertEqual(records[0]['time']['kind'],'occurrence')
        self.assertTrue(records[0]['time']['approximate'])
        self.assertEqual((records[1]['time']['start'],records[1]['time']['end']),(1750,1825))
        self.assertTrue(records[2]['time']['approximate'])
        self.assertNotIn('eventDate',records[2]['time'])
        self.assertEqual(records[3]['time']['kind'],'occurrence')
        self.assertEqual(records[3]['time']['start'],1847)
        self.assertIn('Between 1/1/1700 and 31/12/1900',records[0]['time']['original'])
    def test_wam_mixed_day_first_and_year_first_dates(self):
        with tempfile.TemporaryDirectory() as folder:
            features=[]
            for i,raw in enumerate(['11/09/1905','15/12/1933','14/08/1923','1905/09/11','1905/00/00']):
                features.append({'attributes':{'unique_num':i,'when_lost':raw,'name':'Vessel '+str(i),'type_of_si':'ship','rig':'','lat':-32,'long':115,'where_lost':'WA','position_i':''},'geometry':{'x':115,'y':-32}})
            (Path(folder)/'wam002-all-raw.json').write_text(json.dumps({'features':features}),encoding='utf-8')
            records=module.regional(Path(folder),'wam')[0]
            self.assertEqual(len(records),5)
            self.assertEqual([r['time'].get('eventDate') for r in records],['1905-09-11','1933-12-15','1923-08-14','1905-09-11',None])
    def test_cocos_inventory_uses_documented_phaeton_correction(self):
        with tempfile.TemporaryDirectory() as folder:
            features=[]
            for number,name,date,lon,lat in [(870,'Emden SMS','1914/11/09',96.8204,-11.844467),(977,'Phaeton','1889/09',96.02226667,-12.09455)]:
                features.append({'attributes':{'unique_num':number,'when_lost':date,'name':name,'type_of_si':'ship','rig':'','lat':lat,'long':lon,'where_lost':'Cocos Islands','position_i':''},'geometry':{'x':lon,'y':lat}})
            (Path(folder)/'wam002-all-raw.json').write_text(json.dumps({'features':features}),encoding='utf-8')
            records,details,audit=module.regional(Path(folder),'wam')
            self.assertEqual(len(records),2)
            phaeton=next(r for r in records if r['id']=='wreck-wam-977')
            self.assertEqual(phaeton['location']['lon'],96.856)
            self.assertEqual(phaeton['location']['lat'],-12.095)
            self.assertNotIn('eventDate',phaeton['time'])
            self.assertEqual(details['wreck-wam-977']['publicGeometry']['x'],96.02226667)
            self.assertTrue(any(s['id']=='wam-phaeton-inspection-2005' for s in phaeton['sources']))
    def wreck(self,id,name,date):
        return module.evidence({},module.UKHO_SOURCE,id,int(date[:4]),date,53,-10,name,'ship','',date)
    def test_different_exact_loss_dates_do_not_auto_merge(self):
        a=self.wreck('a','MARY','1900-01-02');b=self.wreck('b','MARY','1900-08-03')
        records,aliases=module.reconcile([a,b],{},[])
        self.assertEqual(len(records),2)
        self.assertEqual(aliases,[])
    def test_name_disambiguators_are_not_stripped_as_qualifiers(self):
        a=self.wreck('a','MARY (I)','1900-01-02');b=self.wreck('b','MARY (II)','1900-01-02')
        records,aliases=module.reconcile([a,b],{},[])
        self.assertEqual(len(records),2)
        self.assertEqual(aliases,[])
        self.assertEqual(module.identity('MARY (POSSIBLY)'),'MARY')
    def test_matching_exact_date_improves_year_only_record(self):
        a=self.wreck('a','MARY','1900-01-02');a['time'].pop('eventDate');a['history'].pop('eventDate')
        b=self.wreck('b','MARY','1900-01-02')
        records,aliases=module.reconcile([a,b],{},[])
        self.assertEqual(len(records),1)
        self.assertEqual(records[0]['time'].get('eventDate'),'1900-01-02')
        self.assertEqual(records[0]['history'].get('eventDate'),'1900-01-02')
        self.assertEqual(len(aliases),1)
    def test_range_does_not_merge_with_single_year_loss(self):
        a=self.wreck('a','MARY','1900-01-02');a['time'].update(start=1800,end=1900,approximate=True);a['time'].pop('eventDate');a['history'].pop('eventDate')
        b=self.wreck('b','MARY','1800-01-02')
        records,aliases=module.reconcile([a,b],{},[])
        self.assertEqual(len(records),2)
        self.assertEqual(aliases,[])
    def test_noaa_audit_enrichment_survives_regeneration_and_is_idempotent(self):
        r=self.wreck('michigan-245','Northern Light','1880-01-01')
        a={'canonicalId':r['id'],'sourceId':'noaa-thunderbay-northern_light','sourceUrl':'https://thunderbay.noaa.gov/shipwrecks/northern_light.html','lossField':'August 1881','publishedPosition':'N44 39.616 W83 17.209','yearConflict':True}
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'audit.json';path.write_text(json.dumps({'aliases':[a]}),encoding='utf-8')
            self.assertTrue(hasattr(module,'apply_catalog_enrichment'),'Importer must reapply public NOAA audit enrichment')
            module.apply_catalog_enrichment([r],path)
            first=copy.deepcopy(r);module.apply_catalog_enrichment([r],path)
        self.assertEqual(r,first)
        self.assertEqual((r['time']['start'],r['time']['end']),(1880,1881))
        self.assertEqual(r['time']['kind'],'occurrence')
        self.assertTrue(r['time']['approximate'])
        self.assertNotIn('eventDate',r['time']);self.assertNotIn('eventDate',r['history'])
        self.assertEqual(r['claims'][0]['status'],'under discussion')
        self.assertTrue(any(s['id']==a['sourceId'] for s in r['sources']))
        self.assertTrue(any(s['sourceId']==a['sourceId'] for s in r['claims'][0]['support']))
    def test_duplicate_identity_keeps_unnamed_losses_separate(self):
        self.assertEqual(module.identity('HMS COMET (Stern Section) — 1820 loss'),'COMET')
        self.assertEqual(module.identity('Comet — 1820 loss'),'COMET')
        self.assertIsNone(module.identity('Unnamed vessel (ukho-123) — 1800 loss'))
        a={'lat':51,'lon':-4};b={'lat':51.01,'lon':-4}
        self.assertLess(module.distance_km(a,b),2)
    def test_loss_dates_keep_precision_and_reject_invalid_or_modern_dates(self):
        self.assertEqual(module.loss_date('19120415'),(1912,'1912-04-15'))
        self.assertEqual(module.loss_date('191204'),(1912,None))
        self.assertEqual(module.loss_date('1912'),(1912,None))
        self.assertIsNone(module.loss_date('19120230'))
        self.assertIsNone(module.loss_date('19350101'))
        self.assertIsNone(module.loss_date('UNKNOWN'))
        self.assertIsNone(module.loss_date('20230819'))
    def test_coordinate_hemispheres_and_ranges(self):
        self.assertAlmostEqual(module.coordinate('45 30.000 S','latitude'),-45.5)
        self.assertAlmostEqual(module.coordinate('0 30 W','longitude'),-.5)
        with self.assertRaises(ValueError):module.coordinate('91 00 N','latitude')
        with self.assertRaises(ValueError):module.coordinate('45 30 E','latitude')
    def test_wrecks_are_not_every_underwater_obstruction(self):
        self.assertTrue(module.is_ship({'wreck_category':'dangerous wreck','type':'sailing vessel'}))
        self.assertFalse(module.is_ship({'wreck_category':'','obstruction_category':'foul ground','type':''}))
        self.assertFalse(module.is_ship({'wreck_category':'dangerous wreck','type':'aircraft'}))
        self.assertTrue(module.is_ship({'wreck_category':'','type':'steam ship','name':'A VESSEL'}))

if __name__=='__main__':unittest.main()
