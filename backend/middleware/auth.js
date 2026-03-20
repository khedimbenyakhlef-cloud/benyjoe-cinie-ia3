'use strict';
const DEV_PASSWORD = process.env.DEV_PASSWORD || 'bjc-dev-2026';
function authMiddleware(req, res) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const cookieHeader = req.headers['cookie'] || '';
  const cookieToken = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('dev_token='));
  const cookieVal = cookieToken ? cookieToken.split('=')[1] : '';
  if (token === DEV_PASSWORD || cookieVal === DEV_PASSWORD) return false;
  res.writeHead(401, {'Content-Type':'text/html; charset=utf-8','WWW-Authenticate':'Basic realm="BJC Dev"'});
  res.end(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>🔒 BJC Dev</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#060a10;color:#e2e8f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh}.box{background:#0b1220;border:1px solid #2a3d55;border-radius:12px;padding:40px;width:340px;text-align:center}.logo{font-size:3rem;margin-bottom:16px}.title{font-size:1.3rem;font-weight:700;color:#c9a84c;margin-bottom:8px}.sub{font-size:.85rem;color:#8096b0;margin-bottom:24px}input{width:100%;padding:12px;background:#111e33;border:1px solid #2a3d55;border-radius:8px;color:#e2e8f0;font-size:1rem;margin-bottom:14px;outline:none}input:focus{border-color:#c9a84c}button{width:100%;padding:12px;background:linear-gradient(135deg,#7a5512,#c9a84c);color:#060a10;border:none;border-radius:8px;font-size:1rem;font-weight:700;cursor:pointer}</style></head><body><div class="box"><div class="logo">🎬</div><div class="title">BENY-JOE CINIE IA</div><div class="sub">Accès développeur requis</div><form onsubmit="login(event)"><input type="password" id="pw" placeholder="Mot de passe développeur" autofocus><button type="submit">🔒 Accéder au Studio</button></form></div><script>function login(e){e.preventDefault();const pw=document.getElementById('pw').value;document.cookie='dev_token='+pw+';path=/;max-age=86400';location.reload()}</script></body></html>`);
  return true;
}
module.exports = { authMiddleware };
