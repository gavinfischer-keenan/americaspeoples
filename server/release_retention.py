"""Keep the verified current atlas and one previous release; dry-run by default.

Shared TripoFisch snapshots retain other applications. Only their atlas components
are pruned. Run after public verification, with the activation receipt.
"""
import argparse, hashlib, json, re, shutil
from pathlib import Path

RELEASE=re.compile(r'\d{8}T\d{6}Z(?:-[A-Za-z0-9._-]+)?')
BACKUP=re.compile(r'(?:atlas-\d{8}T\d{6}Z|\d{8}T\d{6}Z-americas-v[\d.]+-previous)\.sqlite3')

def require(condition,message):
    if not condition:raise ValueError(message)

def real_child(path,parent):
    path=Path(path).absolute();parent=Path(parent).absolute()
    require(path.parent==parent and path.resolve()==path and path.exists(),f'Unsafe or missing release path: {path}')
    return path

def digest(path):
    with path.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()

def plan_retention(api_root,web_root,receipt):
    api_root=Path(api_root).absolute();web_root=Path(web_root).absolute()
    require(api_root.resolve()==api_root and web_root.resolve()==web_root,'Root must not be a symlink')
    api_releases=api_root/'releases';web_releases=web_root/'releases'
    for root in [api_releases,web_releases,api_root/'backups']:
        require(root.is_dir() and root.resolve()==root,'Missing or redirected release directory')
    current_api=real_child(receipt['api'],api_releases);previous_api=real_child(receipt['rollbackApi'],api_releases)
    current_web=real_child(receipt['static'],web_releases);previous_web=real_child(receipt['rollbackStatic'],web_releases)
    require(current_api!=previous_api and current_web!=previous_web,'Current and previous releases must differ')
    require((api_root/'current').is_symlink() and (api_root/'current').resolve()==current_api,'API changed since activation')
    require((web_root/'current').is_symlink() and (web_root/'current').resolve()==current_web,'Static release changed since activation')
    for api in [current_api,previous_api]:
        require((api/'data/atlas.sqlite3').is_file() and (api/'server/app.py').is_file(),'Incomplete protected API release')
    for web in [current_web,previous_web]:require((web/'americaspeoples-app/app.js').is_file(),'Incomplete protected web release')
    ident=receipt['id'];require(RELEASE.fullmatch(ident) and current_api.name==ident,'Unexpected receipt identifier')
    backup=real_child(api_root/'backups'/(ident+'-previous.sqlite3'),api_root/'backups')
    require(digest(backup)==digest(previous_api/'data/atlas.sqlite3'),'Previous database backup mismatch')
    versions={'v'+receipt['health']['version'],'v'+receipt['previousVersion']}
    require(len(versions)==2 and all(re.fullmatch(r'v\d+\.\d+\.\d+',v) for v in versions),'Expected two distinct release versions')
    targets=[]
    def add(path):
        require(path.resolve()==path and not path.is_symlink(),'Cleanup target redirected: '+str(path))
        targets.append(path)
    for path in api_releases.iterdir():
        if RELEASE.fullmatch(path.name) and path not in [current_api,previous_api]:
            real_child(path,api_releases);require(path.is_dir(),'Release is not a directory');add(path)
    for path in (api_root/'backups').iterdir():
        if path!=backup and BACKUP.fullmatch(path.name):real_child(path,api_root/'backups');add(path)
    for web in web_releases.iterdir():
        if not RELEASE.fullmatch(web.name):continue
        real_child(web,web_releases);require(web.is_dir(),'Web release is not a directory')
        if web in [current_web,previous_web]:
            downloads=web/'downloads/americaspeoples'
            require(downloads.is_dir() and downloads.resolve()==downloads,'Protected downloads directory redirected or missing')
            for path in downloads.iterdir():
                if re.fullmatch(r'v\d+\.\d+\.\d+',path.name) and path.name not in versions:add(path)
        else:
            for rel in ['americaspeoples-app','free-utilities/americaspeoples','downloads/americaspeoples']:
                path=web/rel
                if path.exists() or path.is_symlink():add(path)
    return sorted(targets,key=str)

def apply_retention(targets):
    # Refuse late path substitutions; recursive deletion does not follow child symlinks.
    for path in targets:
        require(path.resolve()==path and not path.is_symlink(),'Cleanup target changed: '+str(path))
        if path.is_dir():shutil.rmtree(path)
        else:path.unlink()

def main():
    import fcntl, urllib.request
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--receipt',type=Path,required=True);parser.add_argument('--apply',action='store_true')
    args=parser.parse_args()
    with open('/run/lock/americas-atlas-deploy.lock','w') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        receipt=json.loads(args.receipt.read_text())
        with urllib.request.urlopen('http://127.0.0.1:8105/api/health',timeout=10) as response:health=json.load(response)
        require(health==receipt['health'],'Current health does not match the verified deployment')
        targets=plan_retention('/srv/americaspeoples','/srv/tripofisch',receipt)
        if args.apply:apply_retention(targets)
        print(json.dumps({'applied':args.apply,'targets':[str(p) for p in targets],'keptCurrent':receipt['id'],'keptPrevious':receipt['previousVersion'],'freeBytes':shutil.disk_usage('/srv').free}))

if __name__=='__main__':main()
