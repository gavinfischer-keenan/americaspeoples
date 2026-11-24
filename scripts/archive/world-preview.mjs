// Local paired preview; only HTML responses rewrite the production map origin.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createStaticServer} from './static-server.mjs';
const appPort=Number(process.env.APP_PORT||4183),sitePort=Number(process.env.SITE_PORT||4184);
const appOrigin=`http://127.0.0.1:${appPort}`,siteOrigin=`http://127.0.0.1:${sitePort}`;
const app=createStaticServer('dist',{frameOrigin:siteOrigin});
const root=path.resolve('dist/tripofisch-site');
const site=http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method))throw Error();
  let pathname=decodeURIComponent(new URL(req.url,siteOrigin).pathname);
  if(pathname==='/'){res.writeHead(302,{Location:'/spread-of-peoples/'});res.end();return;}
  if(pathname.includes('\\')||pathname.includes('\0'))throw Error();
  const file=path.resolve(root,'.'+pathname,pathname.endsWith('/')?'index.html':'');if(!file.startsWith(root+path.sep))throw Error();
  let bytes=await fs.readFile(file);const ext=path.extname(file);
  if(ext==='.html')bytes=Buffer.from(bytes.toString('utf8').replaceAll('https://americaspeoples.11mosswood.us',appOrigin));
  res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json'})[ext]??'application/octet-stream');res.setHeader('Cache-Control','no-store');res.writeHead(200);res.end(req.method==='HEAD'?undefined:bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
app.listen(appPort,'127.0.0.1',()=>console.log('Map preview: '+appOrigin));
site.listen(sitePort,'127.0.0.1',()=>console.log('Website preview: '+siteOrigin+'/spread-of-peoples/'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{app.close();site.close();});
