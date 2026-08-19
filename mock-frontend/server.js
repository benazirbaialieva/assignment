import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Zero-dependency static server for the mock client. Runtime configuration is
 * injected as /config.js so the same build can point at any environment.
 */
const PUBLIC_DIR = fileURLToPath(new URL('./public/', import.meta.url));
const PORT = Number.parseInt(process.env.PORT ?? '5173', 10);
const HOST = process.env.HOST ?? '127.0.0.1';

const APP_CONFIG = {
  apiBaseUrl: process.env.API_BASE_URL ?? 'http://127.0.0.1:4000',
  apiKey: process.env.API_KEY ?? 'test-api-key',
  env: process.env.NODE_ENV ?? 'development',
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/config.js') {
    res.writeHead(200, { 'content-type': MIME['.js'], 'cache-control': 'no-store' });
    return res.end(`window.APP_CONFIG = ${JSON.stringify(APP_CONFIG)};`);
  }

  // Extension-less paths map to .html so /dashboard and /dashboard.html both work.
  let pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  if (!extname(pathname)) pathname += '.html';

  // normalize() before join() keeps ../ traversal out of the public dir.
  const filePath = join(PUBLIC_DIR, normalize(pathname).replace(/^(\.\.[/\\])+/, ''));

  try {
    const body = await readFile(filePath);
    res.writeHead(200, {
      'content-type': MIME[extname(filePath)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': MIME['.html'] });
    res.end('<h1 data-testid="not-found">404 — page not found</h1>');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[mock-frontend] listening on http://${HOST}:${PORT} (api=${APP_CONFIG.apiBaseUrl})`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
