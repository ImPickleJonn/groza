// Static file server for GROZA — zero npm deps. Works for local dev and Render.
// Run with: node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const ROOT = __dirname;

const MIME = {
  '.html':'text/html; charset=utf-8',
  '.js':'application/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.gif':'image/gif',
  '.svg':'image/svg+xml',
  '.ico':'image/x-icon',
  '.woff':'font/woff',
  '.woff2':'font/woff2',
  '.otf':'font/otf',
  '.ttf':'font/ttf',
  '.mp3':'audio/mpeg',
  '.wav':'audio/wav',
  '.webp':'image/webp',
  '.txt':'text/plain; charset=utf-8',
};

function safeJoin(root, target){
  const p = path.normalize(path.join(root, target));
  if (!p.startsWith(root)) return null; // prevent path traversal
  return p;
}

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
    const filePath = safeJoin(ROOT, urlPath);
    if (!filePath) { res.writeHead(403); res.end('forbidden'); return; }
    fs.stat(filePath, (err, st) => {
      if (err || !st.isFile()) { res.writeHead(404); res.end('not found'); return; }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      fs.createReadStream(filePath).pipe(res);
    });
  } catch (e) {
    res.writeHead(500); res.end('server error');
  }
});

server.listen(PORT, () => {
  console.log('');
  console.log('  GROZA  -  serving on http://localhost:' + PORT);
  console.log('  Press Ctrl+C to stop.');
  console.log('');
});
