// Local verification only. This server is not included in dist and is not production infrastructure.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
export const hostingHeaders = {
  "Content-Security-Policy":
    "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
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
  return http.createServer(async (req, res) => {
    for (const [name, value] of Object.entries(hostingHeaders))
      res.setHeader(name, value);
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405);
      res.end();
      return;
    }
    try {
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
}
