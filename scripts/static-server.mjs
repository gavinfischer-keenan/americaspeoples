// Local verification only. This server is not included in dist and is not production infrastructure.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import {spawn} from 'node:child_process';
export const hostingHeaders = {
  "Content-Security-Policy":
    "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
  "Cache-Control": "no-cache",
};
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".zip": "application/zip",
};
export function createStaticServer(directory) {
  const root = path.resolve(directory);
  // Actual production Python/SQLite API behind the test static frontend.
  const backend=spawn(process.env.PYTHON_PATH||'python',['server/app.py','--db','release/atlas.sqlite3','--root',root,'--port','0'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
  const ready=new Promise((resolve,reject)=>{
    let output='';
    backend.stdout.on('data',chunk=>{output+=chunk;try{resolve(JSON.parse(output.trim()).port);}catch{}});
    backend.on('error',reject);backend.on('exit',code=>{if(code)reject(new Error('Atlas test backend exited '+code));});
  });
  const server=http.createServer(async (req, res) => {
    for (const [name, value] of Object.entries(hostingHeaders))
      res.setHeader(name, value);
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405);
      res.end();
      return;
    }
    try {
      if(req.url.startsWith('/api/')){
        const port=await ready;
        const upstream=await fetch(`http://127.0.0.1:${port}${req.url}`,{method:req.method});
        const bytes=Buffer.from(await upstream.arrayBuffer());
        for(const key of ['content-type','x-atlas-version'])if(upstream.headers.has(key))res.setHeader(key,upstream.headers.get(key));
        res.writeHead(upstream.status);res.end(req.method==='HEAD'?undefined:bytes);return;
      }
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      if (pathname.includes("\\") || pathname.includes("\0"))
        throw new Error("Invalid path");
      const filename = path.resolve(
        root,
        "." + pathname,
        pathname.endsWith("/") ? "index.html" : "",
      );
      if (!filename.startsWith(root + path.sep))
        throw new Error("Outside root");
      const bytes = await fs.readFile(filename);
      res.setHeader(
        "Content-Type",
        mime[path.extname(filename)] ?? "application/octet-stream",
      );
      res.setHeader("Content-Length", bytes.length);
      res.writeHead(200);
      res.end(req.method === "HEAD" ? undefined : bytes);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  server.on('close',()=>backend.kill());
  return server;
}
