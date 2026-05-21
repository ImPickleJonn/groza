// Static file server + Telegram bot webhook for GROZA — zero npm deps.
// Run locally: `node server.js`
// On Render: BOT_TOKEN env var must be set for /api/tg-webhook to send replies.

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const ROOT = __dirname;
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const PUBLIC_URL = process.env.PUBLIC_URL || 'https://groza-5xd1.onrender.com';

const MIME = {
  '.html':'text/html; charset=utf-8',
  '.js':'application/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.gif':'image/gif', '.svg':'image/svg+xml', '.ico':'image/x-icon',
  '.woff':'font/woff', '.woff2':'font/woff2', '.otf':'font/otf', '.ttf':'font/ttf',
  '.mp3':'audio/mpeg', '.wav':'audio/wav', '.webp':'image/webp',
  '.txt':'text/plain; charset=utf-8',
};

function safeJoin(root, target){
  const p = path.normalize(path.join(root, target));
  if (!p.startsWith(root)) return null;
  return p;
}

// Telegram API call (POST JSON)
function tgCall(method, payload){
  return new Promise((resolve, reject) => {
    if (!BOT_TOKEN) return reject(new Error('BOT_TOKEN not set'));
    const body = Buffer.from(JSON.stringify(payload), 'utf8');
    const req = https.request({
      method: 'POST',
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/${method}`,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': body.length,
      },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve({ raw:data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Welcome messages per language
const WELCOME = {
  en: {
    text:
      '⚡ <b>GROZA</b> — bullet-heaven survivor.\n' +
      '\n' +
      'Move with one finger. Your weapons fire on their own.\n' +
      'Level up, evolve, become the storm.\n' +
      '\n' +
      'Tap <b>PLAY</b> below.',
    btn: 'PLAY GROZA',
  },
  ru: {
    text:
      '⚡ <b>ГРОЗА</b> — выживалка с автострельбой.\n' +
      '\n' +
      'Управляй одним пальцем. Оружие стреляет само.\n' +
      'Прокачайся, эволюционируй, стань грозой.\n' +
      '\n' +
      'Жми <b>ИГРАТЬ</b> ниже.',
    btn: 'ИГРАТЬ В ГРОЗА',
  },
};

function welcomeFor(langCode){
  const c = (langCode || 'en').slice(0,2).toLowerCase();
  return WELCOME[c] || WELCOME.en;
}

async function handleUpdate(update){
  try {
    const msg = update.message || update.edited_message;
    if (!msg) return;
    const chatId = msg.chat && msg.chat.id;
    const text = (msg.text || '').trim();
    if (!chatId) return;
    if (text === '/start' || text.startsWith('/start ') || text === '/play' || text === '/help') {
      const lang = msg.from && msg.from.language_code;
      const w = welcomeFor(lang);
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: w.text,
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
        reply_markup: {
          inline_keyboard: [[
            { text: w.btn, web_app: { url: PUBLIC_URL + '/' } },
          ]],
        },
      });
    }
  } catch (e) {
    console.error('handleUpdate error', e);
  }
}

const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);

    // ---- Telegram webhook ----
    if (req.method === 'POST' && urlPath === '/api/tg-webhook') {
      let chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', async () => {
        try {
          const body = Buffer.concat(chunks).toString('utf8');
          const update = JSON.parse(body);
          // Respond 200 immediately so Telegram doesn't retry
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('ok');
          // Fire and forget
          handleUpdate(update);
        } catch (e) {
          res.writeHead(400); res.end('bad json');
        }
      });
      return;
    }

    // ---- Webhook registration (guarded by BOT_TOKEN) ----
    if (req.method === 'POST' && urlPath === '/api/setup-webhook') {
      const provided = req.headers['x-setup-key'] || '';
      if (!BOT_TOKEN || provided !== BOT_TOKEN) {
        res.writeHead(401); res.end('unauthorized'); return;
      }
      tgCall('setWebhook', {
        url: PUBLIC_URL + '/api/tg-webhook',
        allowed_updates: ['message'],
        drop_pending_updates: true,
      }).then(r => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok:true, telegram:r, url: PUBLIC_URL + '/api/tg-webhook' }));
      }).catch(e => {
        res.writeHead(500); res.end(String(e));
      });
      return;
    }

    // ---- Health ----
    if (urlPath === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok:true, hasToken: !!BOT_TOKEN, publicUrl: PUBLIC_URL }));
      return;
    }

    // ---- Static files ----
    const p = urlPath === '/' || urlPath === '' ? '/index.html' : urlPath;
    const filePath = safeJoin(ROOT, p);
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
  console.log('  BOT_TOKEN: ' + (BOT_TOKEN ? 'set' : 'NOT SET (webhook replies disabled)'));
  console.log('  Press Ctrl+C to stop.');
  console.log('');
});
