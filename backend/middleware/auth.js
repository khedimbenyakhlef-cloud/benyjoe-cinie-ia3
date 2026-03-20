'use strict';
const PWD = process.env.DEV_PASSWORD || 'changeme';
function authMiddleware(req, res) {
  const cookie = (req.headers['cookie'] || '').split(';').map(c=>c.trim()).find(c=>c.startsWith('dev_token='));
  const val = cookie ? cookie.split('=')[1] : '';
  if (val === PWD) return false;
  res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
  res.end(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BJC Studio</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#060a10;color:#e2e8f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh}.box{background:#0b1220;border:1px solid #2a3d55;border-radius:12px;padding:40px;width:340px;text-align:center}.logo{font-size:3rem;margin-bottom:16px}.title{font-size:1.3rem;font-weight:700;color:#c9a84c;margin-bottom:8px}.sub{font-size:.85rem;color:#8096b0;margin-bottom:24px}input{width:100%;padding:12px;background:#111e33;border:1px solid #2a3d55;border-radius:8px;color:#e2e8f0;font-size:1rem;margin-bottom:14px;outline:none}input:focus{border-color:#c9a84c}button{width:100%;padding:12px;background:linear-gradient(135deg,#7a5512,#c9a84c);color:#060a10;border:none;border-radius:8px;font-size:1rem;font-weight:700;cursor:pointer}.err{color:#ef4444;font-size:.8rem;margin-top:8px;display:none}</style></head><body><div class="box"><div class="logo">🎬</div><div class="title">BENY-JOE CINIE IA</div><div class="sub">Studio privé — Accès restreint</div><form onsubmit="login(event)"><input type="password" id="pw" placeholder="Mot de passe" autofocus><button type="submit">🔒 Entrer</button><div class="err" id="err">Mot de passe incorrect</div></form></div><script>function login(e){e.preventDefault();const pw=document.getElementById('pw').value;document.cookie='dev_token='+encodeURIComponent(pw)+';path=/;max-age=86400';location.reload()}window.onload=function(){const c=(document.cookie||'').split(';').map(c=>c.trim()).find(c=>c.startsWith('dev_token='));if(c&&c.split('=')[1]){document.getElementById('err').style.display='block'}}</script></body></html>`);
  return true;
}
module.exports = { authMiddleware };
