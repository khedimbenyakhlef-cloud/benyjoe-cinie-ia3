/**
 * BENY-JOE CINIE IA — Serveur Tout-en-Un
 * Fondé par KHEDIM BENYAKHLEF dit BENY-JOE
 * Clé API : variable d'environnement UNIQUEMENT — jamais dans le code
 */

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, '_data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ─── UTILITAIRES ─────────────────────────────────────────────────────────────
const hashPwd = p => crypto.createHash('sha256').update(p + 'bjci_salt_2025').digest('hex');
const genToken = () => crypto.randomBytes(32).toString('hex');
const loadJ = (f, d = {}) => { try { return JSON.parse(fs.readFileSync(f,'utf8')); } catch(e){ return d; } };
const saveJ = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));
const USERS_F = path.join(DATA_DIR, 'users.json');
const SESS_F  = path.join(DATA_DIR, 'sessions.json');
const CFG_F   = path.join(DATA_DIR, 'config.json');

function initAdmin() {
  const u = loadJ(USERS_F, {});
  if (!Object.keys(u).length) {
    u['benyjoe'] = { username:'benyjoe', password:hashPwd('cinie2025'), role:'admin', name:'KHEDIM BENYAKHLEF' };
    saveJ(USERS_F, u);
    console.log('✅ Admin créé : benyjoe / cinie2025');
  }
}

function createSession(username) {
  const s = loadJ(SESS_F, {});
  const t = genToken();
  s[t] = { username, exp: Date.now() + 86400000 * 7 };
  saveJ(SESS_F, s);
  return t;
}

function validateSession(token) {
  if (!token) return null;
  const s = loadJ(SESS_F, {});
  const sess = s[token];
  if (!sess || Date.now() > sess.exp) { if(sess){ delete s[token]; saveJ(SESS_F,s); } return null; }
  return sess.username;
}

function getApiKey() {
  return process.env.ANTHROPIC_API_KEY || loadJ(CFG_F, {}).key || null;
}

function setApiKey(key) {
  const c = loadJ(CFG_F, {});
  c.key = key;
  saveJ(CFG_F, c);
}

function parseBody(req) {
  return new Promise(res => {
    let b = '';
    req.on('data', c => b += c);
    req.on('end', () => { try { res(JSON.parse(b)); } catch { res({}); } });
  });
}

function getToken(req) {
  return (req.headers.authorization || '').replace('Bearer ', '').trim();
}

// ─── HTML FRONTEND (tout en un) ───────────────────────────────────────────────
const HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BENY-JOE CINIE IA — Studio</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='30' fill='%23070b12' stroke='%23c9a84c' stroke-width='2'/><circle cx='32' cy='32' r='14' fill='none' stroke='%23c9a84c' stroke-width='2'/><circle cx='32' cy='32' r='9' fill='%230d1321'/><text x='32' y='37' font-family='serif' font-size='11' font-weight='900' fill='%23c9a84c' text-anchor='middle'>BJ</text></svg>">
<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
:root{--gold:#c9a84c;--gold2:#e8c96a;--gold3:#f5e4a0;--dark:#070b12;--dark2:#0d1321;--dark3:#111827;--card:#0d1a2e;--card2:#0f1f35;--text:#e8edf5;--muted:#7a8fa8;--dim:#3a4f66;--red:#e05555;--green:#3db880;--blue:#4a9eff;--border:rgba(201,168,76,0.18);--radius:12px;}
body{font-family:'Lato',sans-serif;background:var(--dark);color:var(--text);min-height:100vh;overflow-x:hidden;}
::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-thumb{background:var(--dim);border-radius:3px;}::-webkit-scrollbar-thumb:hover{background:var(--gold);}
#auth-screen{position:fixed;inset:0;background:var(--dark);display:flex;align-items:center;justify-content:center;z-index:9999;flex-direction:column;gap:1.5rem;}
.auth-logo{font-family:'Cinzel',serif;font-size:2.4rem;font-weight:900;background:linear-gradient(135deg,var(--gold),var(--gold3));-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-align:center;letter-spacing:4px;}
.auth-founder{color:var(--gold);font-size:.72rem;text-align:center;letter-spacing:1.5px;opacity:.8;}
.auth-box{background:var(--card);border:1px solid var(--border);border-radius:20px;padding:2rem;width:370px;display:flex;flex-direction:column;gap:1rem;}
.auth-tabs{display:flex;border-radius:10px;overflow:hidden;border:1px solid var(--dim);}
.auth-tab{flex:1;padding:.55rem;background:transparent;border:none;color:var(--muted);font-size:.8rem;font-weight:700;cursor:pointer;transition:.2s;}
.auth-tab.active{background:rgba(201,168,76,0.15);color:var(--gold);}
.auth-panel{display:flex;flex-direction:column;gap:.8rem;}
.auth-box input{background:#0a1525;border:1px solid var(--dim);border-radius:8px;padding:.8rem 1rem;color:var(--text);font-size:.9rem;outline:none;transition:.2s;width:100%;}
.auth-box input:focus{border-color:var(--gold);}
.auth-btn{background:linear-gradient(135deg,#8a6418,var(--gold));color:#0d0a02;font-weight:700;border:none;border-radius:8px;padding:.85rem;cursor:pointer;font-size:.95rem;letter-spacing:1px;transition:.2s;}
.auth-btn:hover{filter:brightness(1.1);}
.auth-err{color:var(--red);font-size:.82rem;text-align:center;display:none;}
.film-strip{display:flex;gap:4px;justify-content:center;}
.film-cell{width:28px;height:20px;background:var(--dim);border-radius:2px;opacity:.3;}
.film-cell:nth-child(3n){opacity:.6;}
header{background:rgba(7,11,18,.95);border-bottom:1px solid var(--border);padding:.7rem 1.5rem;display:flex;align-items:center;gap:1rem;position:sticky;top:0;z-index:100;backdrop-filter:blur(10px);}
.logo{font-family:'Cinzel',serif;font-size:1.1rem;font-weight:900;background:linear-gradient(135deg,var(--gold),var(--gold3));-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:3px;white-space:nowrap;}
.logo-sub{font-size:.55rem;color:var(--muted);letter-spacing:2px;}
nav{display:flex;gap:.25rem;flex-wrap:wrap;margin-left:.3rem;}
.nav-btn{padding:.45rem .8rem;border:1px solid transparent;border-radius:20px;background:transparent;color:var(--muted);font-size:.72rem;font-weight:600;cursor:pointer;letter-spacing:.5px;transition:.2s;}
.nav-btn:hover,.nav-btn.active{background:rgba(201,168,76,0.12);border-color:var(--border);color:var(--gold);}
.header-right{margin-left:auto;display:flex;align-items:center;gap:.8rem;}
.dot{width:7px;height:7px;border-radius:50%;background:var(--green);animation:pulse 2s infinite;display:inline-block;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.user-info{font-size:.72rem;color:var(--gold);font-weight:700;}
.logout-btn{padding:.3rem .65rem;border-radius:7px;border:1px solid var(--dim);background:transparent;color:var(--muted);font-size:.7rem;cursor:pointer;transition:.2s;}
.logout-btn:hover{border-color:var(--red);color:var(--red);}
.app{display:none;flex-direction:column;min-height:100vh;}
.app.visible{display:flex;}
.main{flex:1;padding:1.5rem 2rem;max-width:1600px;margin:0 auto;width:100%;}
.tab{display:none;}.tab.active{display:block;}
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1.4rem;margin-bottom:1.4rem;}
.card-title{font-family:'Cinzel',serif;font-size:.9rem;color:var(--gold);letter-spacing:2px;margin-bottom:1.1rem;display:flex;align-items:center;gap:.6rem;}
.card-title::before{content:'';display:block;width:3px;height:14px;background:var(--gold);border-radius:2px;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:1.1rem;}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.1rem;}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;}
@media(max-width:900px){.grid2,.grid3,.grid4{grid-template-columns:1fr 1fr;}}
@media(max-width:600px){.grid2,.grid3,.grid4{grid-template-columns:1fr;}.main{padding:1rem;}nav{display:none;}}
label{font-size:.76rem;color:var(--muted);display:block;margin-bottom:.35rem;letter-spacing:.5px;}
input,textarea,select{width:100%;background:#060d19;border:1px solid var(--dim);border-radius:8px;padding:.7rem .9rem;color:var(--text);font-size:.86rem;font-family:'Lato',sans-serif;outline:none;transition:.2s;resize:vertical;}
input:focus,textarea:focus,select:focus{border-color:var(--gold);}
textarea{min-height:110px;}
.btn{padding:.6rem 1.2rem;border-radius:8px;border:none;cursor:pointer;font-size:.8rem;font-weight:700;letter-spacing:.5px;transition:.2s;display:inline-flex;align-items:center;gap:.4rem;font-family:'Lato',sans-serif;}
.btn-gold{background:linear-gradient(135deg,#7a5512,var(--gold));color:#0d0a02;}.btn-gold:hover{filter:brightness(1.15);}
.btn-outline{background:transparent;border:1px solid var(--dim);color:var(--text);}.btn-outline:hover{border-color:var(--gold);color:var(--gold);}
.btn-red{background:rgba(224,85,85,.15);border:1px solid rgba(224,85,85,.3);color:var(--red);}
.btn:disabled{opacity:.4;cursor:not-allowed;}
.type-pills{display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.9rem;}
.pill{padding:.35rem .8rem;border-radius:20px;border:1px solid var(--dim);font-size:.75rem;cursor:pointer;color:var(--muted);transition:.2s;}
.pill:hover,.pill.active{background:rgba(201,168,76,0.15);border-color:var(--gold);color:var(--gold);}
.scene-list{display:flex;flex-direction:column;gap:.7rem;}
.scene-item{background:#07111e;border:1px solid var(--dim);border-radius:10px;padding:.9rem;display:flex;gap:.7rem;align-items:flex-start;}
.scene-num{min-width:26px;height:26px;border-radius:50%;background:rgba(201,168,76,.15);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:.72rem;color:var(--gold);font-weight:700;}
.chat-messages{background:#060d19;border:1px solid var(--dim);border-radius:10px;padding:.9rem;height:340px;overflow-y:auto;display:flex;flex-direction:column;gap:.6rem;}
.msg{padding:.65rem .9rem;border-radius:10px;max-width:85%;font-size:.83rem;line-height:1.5;}
.msg-ai{background:var(--card2);border:1px solid var(--border);align-self:flex-start;}
.msg-user{background:rgba(201,168,76,.12);border:1px solid rgba(201,168,76,.2);align-self:flex-end;}
.msg-name{font-size:.67rem;font-weight:700;margin-bottom:.2rem;}
.msg-ai .msg-name{color:var(--gold);}.msg-user .msg-name{color:var(--muted);}
.chat-row{display:flex;gap:.5rem;margin-top:.7rem;}.chat-row input{flex:1;}
.tool-card{background:var(--card2);border:1px solid var(--dim);border-radius:var(--radius);padding:1.1rem;cursor:pointer;transition:.2s;text-align:center;}
.tool-card:hover{border-color:var(--gold);transform:translateY(-2px);}
.tool-icon{font-size:1.7rem;margin-bottom:.5rem;}.tool-name{font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:.25rem;}.tool-desc{font-size:.7rem;color:var(--muted);line-height:1.4;}
.tool-badge{font-size:.62rem;padding:.12rem .45rem;border-radius:7px;margin-top:.35rem;display:inline-block;}
.badge-free{background:rgba(61,184,128,.15);border:1px solid rgba(61,184,128,.3);color:var(--green);}
.badge-api{background:rgba(74,158,255,.15);border:1px solid rgba(74,158,255,.3);color:var(--blue);}
.output-box{background:#040a14;border:1px solid var(--dim);border-radius:10px;padding:1.1rem;min-height:130px;font-size:.82rem;line-height:1.6;color:var(--text);white-space:pre-wrap;}
.output-actions{display:flex;gap:.45rem;margin-top:.6rem;flex-wrap:wrap;}
.progress-bar{height:4px;background:var(--dim);border-radius:2px;margin:.8rem 0;overflow:hidden;}
.progress-fill{height:100%;background:linear-gradient(90deg,var(--gold),var(--gold3));border-radius:2px;transition:width .5s;width:0%;}
.steps{display:flex;gap:0;margin-bottom:1.3rem;overflow-x:auto;}
.step{flex:1;min-width:75px;padding:.55rem;text-align:center;font-size:.68rem;color:var(--muted);border-bottom:2px solid var(--dim);transition:.2s;}
.step.active{color:var(--gold);border-bottom-color:var(--gold);}
.drop-zone{border:2px dashed var(--dim);border-radius:10px;padding:1.8rem;text-align:center;cursor:pointer;transition:.2s;color:var(--muted);font-size:.83rem;}
.drop-zone:hover{border-color:var(--gold);color:var(--gold);}
.drop-zone input{display:none;}
.timeline{display:flex;gap:2px;overflow-x:auto;background:#04090f;border:1px solid var(--dim);border-radius:8px;padding:.5rem;min-height:70px;align-items:center;}
.tl-clip{background:rgba(201,168,76,.2);border:1px solid var(--border);border-radius:4px;height:44px;min-width:75px;padding:.25rem .45rem;font-size:.65rem;color:var(--gold);cursor:pointer;transition:.2s;display:flex;flex-direction:column;justify-content:space-between;}
.settings-row{display:flex;align-items:center;padding:.8rem 0;border-bottom:1px solid rgba(255,255,255,.05);}
.settings-label{flex:1;font-size:.85rem;}.settings-hint{font-size:.72rem;color:var(--muted);margin-top:.12rem;}
.toggle{width:38px;height:20px;background:var(--dim);border-radius:10px;position:relative;cursor:pointer;transition:.2s;}
.toggle.on{background:var(--gold);}.toggle::after{content:'';position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:.2s;}.toggle.on::after{left:20px;}
.loader{display:inline-block;width:15px;height:15px;border:2px solid var(--dim);border-top-color:var(--gold);border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}
.notif{position:fixed;top:1rem;right:1.5rem;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:.75rem 1.1rem;font-size:.8rem;z-index:9998;transform:translateX(110%);transition:.3s;max-width:300px;}
.notif.show{transform:translateX(0);}.notif.success{border-color:rgba(61,184,128,.4);color:var(--green);}.notif.error{border-color:rgba(224,85,85,.4);color:var(--red);}
.tag{padding:.18rem .55rem;border-radius:6px;font-size:.68rem;background:rgba(255,255,255,.06);border:1px solid var(--dim);color:var(--muted);}
.row{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;}
hr.fancy{border:none;height:1px;background:linear-gradient(90deg,transparent,var(--border),transparent);margin:1rem 0;}
.founder-badge{font-size:.66rem;color:var(--gold);opacity:.7;letter-spacing:1.5px;text-align:center;}
footer{text-align:center;padding:.8rem;font-size:.68rem;color:var(--dim);border-top:1px solid var(--border);}
</style>
</head>
<body>

<div id="auth-screen">
  <div>
    <div style="font-size:3rem;text-align:center;">🎬</div>
    <div class="auth-logo">BENY-JOE CINIE IA</div>
    <div style="color:var(--muted);font-size:.82rem;text-align:center;letter-spacing:2px;">STUDIO DE PRODUCTION CINÉMATOGRAPHIQUE</div>
    <div class="auth-founder" style="margin-top:.4rem;">✦ Fondé par KHEDIM BENYAKHLEF dit BENY-JOE ✦</div>
  </div>
  <div class="auth-box">
    <div class="auth-tabs">
      <button class="auth-tab active" onclick="switchTab('login',this)">🔐 Connexion</button>
      <button class="auth-tab" onclick="switchTab('register',this)">✨ Inscription</button>
    </div>
    <div class="auth-panel" id="panel-login">
      <div><label>Nom d'utilisateur</label><input type="text" id="login-user" placeholder="identifiant" autocomplete="username"></div>
      <div><label>Mot de passe</label><input type="password" id="login-pass" placeholder="••••••••" autocomplete="current-password"></div>
      <button class="auth-btn" id="login-btn" onclick="doLogin()">▶ ENTRER DANS LE STUDIO</button>
      <div class="auth-err" id="login-err"></div>
      <div style="font-size:.68rem;color:var(--dim);text-align:center;">Admin par défaut : benyjoe / cinie2025</div>
    </div>
    <div class="auth-panel" id="panel-register" style="display:none;">
      <div><label>Nom d'utilisateur</label><input type="text" id="reg-user" placeholder="ex: jean_dupont" autocomplete="username"></div>
      <div><label>Votre nom complet</label><input type="text" id="reg-name" placeholder="ex: Jean Dupont"></div>
      <div><label>Mot de passe (min 6 car.)</label><input type="password" id="reg-pass" placeholder="••••••••" autocomplete="new-password"></div>
      <div><label>Confirmer le mot de passe</label><input type="password" id="reg-pass2" placeholder="••••••••"></div>
      <button class="auth-btn" id="reg-btn" onclick="doRegister()">✨ CRÉER MON COMPTE</button>
      <div class="auth-err" id="reg-err"></div>
    </div>
  </div>
  <div class="film-strip"><div class="film-cell"></div><div class="film-cell"></div><div class="film-cell"></div><div class="film-cell"></div><div class="film-cell"></div><div class="film-cell"></div><div class="film-cell"></div><div class="film-cell"></div></div>
  <div style="font-size:.68rem;color:var(--dim);">Outils 100% gratuits · Claude AI · Stable Diffusion · DaVinci Resolve</div>
</div>

<div class="app" id="app">
  <header>
    <div style="cursor:pointer" onclick="goTab('tab-accueil',document.querySelectorAll('.nav-btn')[0])">
      <div class="logo">🎬 BENY-JOE CINIE IA</div>
      <div class="logo-sub">STUDIO PROFESSIONNEL · KHEDIM BENYAKHLEF</div>
    </div>
    <nav>
      <button class="nav-btn active" onclick="goTab('tab-accueil',this)">🏠 Accueil</button>
      <button class="nav-btn" onclick="goTab('tab-scenario',this)">📝 Scénario</button>
      <button class="nav-btn" onclick="goTab('tab-import',this)">📚 Import</button>
      <button class="nav-btn" onclick="goTab('tab-production',this)">🎬 Production</button>
      <button class="nav-btn" onclick="goTab('tab-visuel',this)">🖼️ Visuels</button>
      <button class="nav-btn" onclick="goTab('tab-montage',this)">✂️ Montage</button>
      <button class="nav-btn" onclick="goTab('tab-assistant',this)">🤖 Assistant</button>
      <button class="nav-btn" onclick="goTab('tab-outils',this)">🛠️ Outils</button>
      <button class="nav-btn" onclick="goTab('tab-config',this)">⚙️ Config</button>
    </nav>
    <div class="header-right">
      <span class="dot"></span>
      <span class="user-info" id="user-display"></span>
      <button class="logout-btn" onclick="doLogout()">Déconnexion</button>
    </div>
  </header>
  <div class="main">

    <!-- ACCUEIL -->
    <div class="tab active" id="tab-accueil">
      <div style="text-align:center;padding:1.8rem 0 1.5rem;">
        <div style="font-size:3rem;margin-bottom:.5rem;">🎬</div>
        <div style="font-family:'Cinzel',serif;font-size:2rem;font-weight:900;background:linear-gradient(135deg,var(--gold),var(--gold3));-webkit-background-clip:text;-webkit-text-fill-color:transparent;">BENY-JOE CINIE IA</div>
        <div style="color:var(--muted);letter-spacing:3px;font-size:.78rem;margin-top:.3rem;">PLATEFORME DE PRODUCTION CINÉMATOGRAPHIQUE IA</div>
        <div class="founder-badge" style="margin-top:.5rem;">✦ Fondé par KHEDIM BENYAKHLEF dit BENY-JOE ✦</div>
        <div style="margin-top:.9rem;display:flex;gap:.4rem;justify-content:center;flex-wrap:wrap;">
          <span class="tag">🆓 100% Gratuit</span><span class="tag">🤖 Claude AI</span><span class="tag">🎨 Stable Diffusion</span><span class="tag">🎵 Suno AI</span><span class="tag">🎬 Runway ML</span>
        </div>
      </div>
      <div class="grid4">
        <div class="tool-card" onclick="goTab('tab-scenario',document.querySelectorAll('.nav-btn')[1])"><div class="tool-icon">📝</div><div class="tool-name">Scénario IA</div><div class="tool-desc">Génération automatique de scénarios professionnels.</div><span class="tool-badge badge-api">CLAUDE AI</span></div>
        <div class="tool-card" onclick="goTab('tab-import',document.querySelectorAll('.nav-btn')[2])"><div class="tool-icon">📚</div><div class="tool-name">Roman → Film</div><div class="tool-desc">Adaptez un texte ou roman en scénario cinéma.</div><span class="tool-badge badge-free">GRATUIT</span></div>
        <div class="tool-card" onclick="goTab('tab-production',document.querySelectorAll('.nav-btn')[3])"><div class="tool-icon">🎬</div><div class="tool-name">Production</div><div class="tool-desc">Plan de production complet par type de film.</div><span class="tool-badge badge-api">CLAUDE AI</span></div>
        <div class="tool-card" onclick="goTab('tab-visuel',document.querySelectorAll('.nav-btn')[4])"><div class="tool-icon">🖼️</div><div class="tool-name">Visuels IA</div><div class="tool-desc">Prompts optimisés pour storyboards et affiches.</div><span class="tool-badge badge-free">GRATUIT</span></div>
        <div class="tool-card" onclick="goTab('tab-montage',document.querySelectorAll('.nav-btn')[5])"><div class="tool-icon">✂️</div><div class="tool-name">Montage</div><div class="tool-desc">Timeline + conseils de montage par IA.</div><span class="tool-badge badge-free">GRATUIT</span></div>
        <div class="tool-card" onclick="goTab('tab-assistant',document.querySelectorAll('.nav-btn')[6])"><div class="tool-icon">🤖</div><div class="tool-name">Assistant IA</div><div class="tool-desc">Coach cinéma personnel, disponible 24h/24.</div><span class="tool-badge badge-api">CLAUDE AI</span></div>
        <div class="tool-card" onclick="goTab('tab-outils',document.querySelectorAll('.nav-btn')[7])"><div class="tool-icon">🛠️</div><div class="tool-name">Outils Gratuits</div><div class="tool-desc">Catalogue complet des meilleurs outils IA gratuits.</div><span class="tool-badge badge-free">CATALOGUE</span></div>
        <div class="tool-card" onclick="goTab('tab-config',document.querySelectorAll('.nav-btn')[8])"><div class="tool-icon">⚙️</div><div class="tool-name">Configuration</div><div class="tool-desc">Paramètres, clés API, préférences du studio.</div><span class="tool-badge badge-free">SETUP</span></div>
      </div>
      <div class="card"><div class="card-title">WORKFLOW PROFESSIONNEL</div>
        <div class="steps">
          <div class="step active"><span style="font-size:.9rem;font-weight:700;display:block;">1</span>Synopsis</div>
          <div class="step"><span style="font-size:.9rem;font-weight:700;display:block;">2</span>Scénario</div>
          <div class="step"><span style="font-size:.9rem;font-weight:700;display:block;">3</span>Storyboard</div>
          <div class="step"><span style="font-size:.9rem;font-weight:700;display:block;">4</span>Production</div>
          <div class="step"><span style="font-size:.9rem;font-weight:700;display:block;">5</span>Visuels</div>
          <div class="step"><span style="font-size:.9rem;font-weight:700;display:block;">6</span>Son/VO</div>
          <div class="step"><span style="font-size:.9rem;font-weight:700;display:block;">7</span>Montage</div>
          <div class="step"><span style="font-size:.9rem;font-weight:700;display:block;">8</span>Export</div>
        </div>
      </div>
    </div>

    <!-- SCÉNARIO -->
    <div class="tab" id="tab-scenario">
      <div class="card"><div class="card-title">TYPE DE PRODUCTION</div>
        <div class="type-pills" id="prod-type-pills">
          <span class="pill active">🎬 Court Métrage</span><span class="pill">🎥 Long Métrage</span><span class="pill">🎵 Clip Musical</span><span class="pill">📹 Documentaire</span><span class="pill">🎨 Dessin Animé</span><span class="pill">📺 Série Web</span>
        </div>
        <div class="grid2">
          <div><label>TITRE DU PROJET</label><input type="text" id="proj-titre" placeholder="Ex: La Dernière Lumière d'Oran"></div>
          <div><label>GENRE</label><select id="proj-genre"><option>Drame</option><option>Thriller</option><option>Romance</option><option>Science-Fiction</option><option>Horreur</option><option>Comédie</option><option>Action</option><option>Historique</option><option>Fantastique</option><option>Documentaire</option></select></div>
          <div><label>DURÉE</label><select id="proj-duree"><option>3 min (Clip)</option><option>15 min (Court)</option><option>30 min (Moyen)</option><option>1h30 (Long métrage)</option><option>2h+ (Épique)</option></select></div>
          <div><label>LANGUE</label><select id="proj-langue"><option>Français</option><option>Arabe classique</option><option>Darija algérienne</option><option>Anglais</option><option>Bilingue FR/AR</option></select></div>
        </div>
      </div>
      <div class="grid2">
        <div class="card"><div class="card-title">SYNOPSIS</div>
          <textarea id="synopsis" placeholder="Décrivez votre histoire..." style="min-height:170px;"></textarea>
          <div style="display:flex;gap:.5rem;margin-top:.7rem;flex-wrap:wrap;">
            <button class="btn btn-gold" onclick="genererScenario()">✨ Générer scénario</button>
            <button class="btn btn-outline" onclick="ameliorerSynopsis()">🔧 Améliorer</button>
          </div>
        </div>
        <div class="card"><div class="card-title">PERSONNAGES</div>
          <div id="perso-list" style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:.7rem;max-height:170px;overflow-y:auto;"></div>
          <div style="display:flex;gap:.4rem;"><div style="flex:1"><input type="text" id="new-perso" placeholder="Nom, rôle..."></div><button class="btn btn-outline" onclick="ajouterPerso()">+</button></div>
          <button class="btn btn-outline" style="margin-top:.5rem;width:100%;" onclick="genererPersonnages()">🤖 Générer depuis synopsis</button>
        </div>
      </div>
      <div class="card"><div class="card-title">DÉCOUPAGE EN SCÈNES</div>
        <div style="display:flex;gap:.5rem;margin-bottom:.9rem;flex-wrap:wrap;align-items:center;">
          <button class="btn btn-gold" onclick="ajouterScene()">+ Nouvelle scène</button>
          <button class="btn btn-outline" onclick="restructurerScenes()">🔄 Restructurer IA</button>
          <button class="btn btn-outline" onclick="exporterScript()">📄 Exporter</button>
          <span style="margin-left:auto;font-size:.75rem;color:var(--muted);" id="scenes-count">0 scène(s)</span>
        </div>
        <div class="scene-list" id="scenes-container"></div>
        <div style="text-align:center;padding:1.5rem;color:var(--dim);font-size:.8rem;" id="empty-scenes">✦ Générez ou ajoutez des scènes manuellement</div>
      </div>
    </div>

    <!-- IMPORT -->
    <div class="tab" id="tab-import">
      <div class="card"><div class="card-title">IMPORT — ROMAN / TEXTE</div>
        <div class="grid2">
          <div><div class="drop-zone" onclick="document.getElementById('import-file').click()"><input type="file" id="import-file" accept=".txt,.pdf" onchange="chargerFichier(this)"><div style="font-size:2rem;margin-bottom:.4rem;">📂</div><div>Déposer un fichier ici</div><div style="font-size:.7rem;color:var(--dim);margin-top:.25rem;">TXT, PDF — Max 5MB</div></div></div>
          <div><label>OU COLLER LE TEXTE</label><textarea id="import-text" placeholder="Collez votre texte..." style="min-height:120px;"></textarea></div>
        </div>
        <div class="grid2" style="margin-top:.9rem;">
          <div><label>TYPE D'ŒUVRE</label><select id="import-type"><option>Roman classique</option><option>Roman policier</option><option>Romance</option><option>Biographie</option><option>Nouvelle</option></select></div>
          <div><label>ADAPTER EN</label><select id="import-adapt"><option>Court métrage (15 min)</option><option>Long métrage (1h30)</option><option>Clip musical</option><option>Mini-série</option><option>Documentaire</option></select></div>
        </div>
        <button class="btn btn-gold" style="margin-top:.9rem;" onclick="analyserTexte()">🔍 Analyser et adapter avec IA</button>
      </div>
      <div class="card" id="import-result" style="display:none;"><div class="card-title">RÉSULTAT</div>
        <div class="output-box" id="import-output"></div>
        <div class="output-actions"><button class="btn btn-gold" onclick="importerVersScenario()">→ Vers Scénario</button><button class="btn btn-outline" onclick="copier('import-output')">📋 Copier</button></div>
      </div>
    </div>

    <!-- PRODUCTION -->
    <div class="tab" id="tab-production">
      <div class="card"><div class="card-title">TYPE DE PRODUCTION</div>
        <div class="grid3">
          <div class="tool-card prod-type-card" id="prod-cm" onclick="selectProd('court')" style="border-color:var(--gold);background:rgba(201,168,76,.08)"><div class="tool-icon">🎬</div><div class="tool-name">Court Métrage</div><div class="tool-desc">5 à 30 min. Structure 3 actes.</div></div>
          <div class="tool-card prod-type-card" id="prod-lm" onclick="selectProd('long')"><div class="tool-icon">🎥</div><div class="tool-name">Long Métrage</div><div class="tool-desc">1h30+. Arcs narratifs complets.</div></div>
          <div class="tool-card prod-type-card" id="prod-clip" onclick="selectProd('clip')"><div class="tool-icon">🎵</div><div class="tool-name">Clip Musical</div><div class="tool-desc">3-5 min. Synchronisé musique.</div></div>
          <div class="tool-card prod-type-card" id="prod-doc" onclick="selectProd('doc')"><div class="tool-icon">📹</div><div class="tool-name">Documentaire</div><div class="tool-desc">Voix off, interviews, narration.</div></div>
          <div class="tool-card prod-type-card" id="prod-anim" onclick="selectProd('anim')"><div class="tool-icon">🎨</div><div class="tool-name">Dessin Animé</div><div class="tool-desc">Animation 2D/3D. Prompts SD.</div></div>
          <div class="tool-card prod-type-card" id="prod-serie" onclick="selectProd('serie')"><div class="tool-icon">📺</div><div class="tool-name">Série Web</div><div class="tool-desc">Épisodes 15-45 min. Saisons.</div></div>
        </div>
      </div>
      <div class="card"><div class="card-title">PARAMÈTRES</div>
        <div class="grid2">
          <div><label>STYLE VISUEL</label><select id="style-visuel"><option>Réaliste cinématographique (4K)</option><option>Film noir et blanc</option><option>Animation Ghibli</option><option>Anime japonais</option><option>Hyperréaliste photo</option><option>Vintage Super 8</option><option>Néonoir futuriste</option></select></div>
          <div><label>RATIO</label><select id="ratio"><option>16:9 (YouTube/TV)</option><option>2.39:1 (Cinémascope)</option><option>9:16 (TikTok/Reels)</option><option>1:1 (Carré)</option></select></div>
          <div><label>PALETTE</label><select id="palette"><option>Naturel</option><option>Chaud et doré</option><option>Froid et bleu</option><option>Désaturé dramatique</option><option>Teal & Orange</option></select></div>
          <div><label>LANGUE DIALOGUES</label><select id="langue-prod"><option>Français</option><option>Arabe classique</option><option>Darija algérienne</option><option>Anglais</option><option>Bilingue</option></select></div>
        </div>
        <hr class="fancy">
        <label>CRITÈRES SPÉCIAUX</label>
        <textarea id="prod-criteres" placeholder="Ambiance, références de films, contraintes..."></textarea>
        <div style="display:flex;gap:.5rem;margin-top:.9rem;flex-wrap:wrap;">
          <button class="btn btn-gold" onclick="lancerProduction()">🎬 Générer plan de production</button>
          <button class="btn btn-outline" onclick="genererPrompts()">📸 Prompts visuels</button>
          <button class="btn btn-outline" onclick="genererVoixOff()">🎙️ Voix off</button>
        </div>
      </div>
      <div class="card" id="prod-output-card" style="display:none;"><div class="card-title">PLAN DE PRODUCTION IA</div>
        <div class="progress-bar"><div class="progress-fill" id="prod-progress"></div></div>
        <div class="output-box" id="prod-output"></div>
        <div class="output-actions">
          <button class="btn btn-gold" onclick="goTab('tab-montage',document.querySelectorAll('.nav-btn')[5])">→ Montage</button>
          <button class="btn btn-outline" onclick="copier('prod-output')">📋 Copier</button>
          <button class="btn btn-outline" onclick="exporterTxt('prod-output','plan_production.txt')">💾 Exporter</button>
        </div>
      </div>
    </div>

    <!-- VISUELS -->
    <div class="tab" id="tab-visuel">
      <div class="card"><div class="card-title">GÉNÉRATEUR DE PROMPTS VISUELS</div>
        <div class="grid2">
          <div>
            <label>DESCRIPTION DE LA SCÈNE</label>
            <textarea id="vis-desc" placeholder="Ex: Plan large d'une médina algérienne au coucher du soleil..." style="min-height:100px;"></textarea>
            <label style="margin-top:.6rem;">STYLE</label>
            <select id="vis-style"><option>Réaliste photoréaliste (SD XL)</option><option>Film cinéma 35mm</option><option>Peinture numérique</option><option>Concept art</option><option>Anime/Manga</option><option>Cartoon 3D Pixar</option><option>Photo vintage</option></select>
            <button class="btn btn-gold" style="margin-top:.7rem;width:100%;" onclick="genererPromptVisuel()">✨ Générer prompt</button>
          </div>
          <div>
            <label>PROMPT GÉNÉRÉ</label>
            <div class="output-box" id="vis-prompt" style="min-height:120px;">En attente...</div>
            <div class="output-actions" style="margin-top:.5rem;">
              <button class="btn btn-outline" onclick="copier('vis-prompt')">📋 Copier</button>
              <button class="btn btn-outline" onclick="window.open('https://leonardo.ai','_blank')">→ Leonardo AI</button>
              <button class="btn btn-outline" onclick="window.open('https://www.bing.com/images/create','_blank')">→ Bing Creator</button>
            </div>
          </div>
        </div>
      </div>
      <div class="card"><div class="card-title">STORYBOARD AUTOMATIQUE</div>
        <button class="btn btn-gold" onclick="genererStoryboard()">🎨 Générer storyboard complet</button>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:1rem;margin-top:1rem;" id="storyboard-grid"></div>
      </div>
    </div>

    <!-- MONTAGE -->
    <div class="tab" id="tab-montage">
      <div class="card"><div class="card-title">TIMELINE — MONTAGE</div>
        <div style="margin-bottom:.5rem;"><div style="font-size:.7rem;color:var(--muted);margin-bottom:.3rem;">▶ VIDÉO</div><div class="timeline"><div style="display:flex;gap:2px;flex:1;" id="timeline-video"></div></div></div>
        <div><div style="font-size:.7rem;color:var(--muted);margin-bottom:.3rem;">🎵 AUDIO</div><div class="timeline"><div style="display:flex;gap:2px;flex:1;" id="timeline-audio"></div></div></div>
        <div style="display:flex;gap:.5rem;margin-top:.9rem;">
          <button class="btn btn-outline" onclick="ajouterClip()">+ Clip vidéo</button>
          <button class="btn btn-outline" onclick="ajouterMusique()">+ Musique</button>
          <button class="btn btn-gold" onclick="genererMontage()">🤖 Conseils montage IA</button>
        </div>
      </div>
      <div class="card"><div class="card-title">RECOMMANDATIONS IA</div>
        <div class="output-box" id="montage-suggestions">Cliquez sur "Conseils montage IA" pour des recommandations.</div>
        <div class="output-actions">
          <button class="btn btn-outline" onclick="copier('montage-suggestions')">📋 Copier</button>
          <button class="btn btn-outline" onclick="exporterTxt('montage-suggestions','plan_montage.txt')">💾 Exporter</button>
          <button class="btn btn-outline" onclick="window.open('https://www.blackmagicdesign.com/fr/products/davinciresolve','_blank')">→ DaVinci Resolve</button>
        </div>
      </div>
    </div>

    <!-- ASSISTANT -->
    <div class="tab" id="tab-assistant">
      <div class="card"><div class="card-title">🤖 BENY-JOE CINIE IA — ASSISTANT</div>
        <div class="type-pills" id="mode-pills">
          <span class="pill active">Conversation libre</span><span class="pill">Scénario & Écriture</span><span class="pill">Réalisation technique</span><span class="pill">Production & Budget</span><span class="pill">Montage & Post-prod</span><span class="pill">Festivals & Distribution</span>
        </div>
        <div class="chat-messages" id="chat-box">
          <div class="msg msg-ai"><div class="msg-name">🎬 BENY-JOE CINIE IA</div>Bonjour ! Je suis votre assistant cinéma professionnel, fondé par KHEDIM BENYAKHLEF dit BENY-JOE. Comment puis-je vous aider ?</div>
        </div>
        <div class="chat-row">
          <input type="text" id="chat-input" placeholder="Posez votre question cinéma...">
          <button class="btn btn-gold" onclick="envoyerMessage()">Envoyer</button>
          <button class="btn btn-outline" onclick="effacerChat()">🗑️</button>
        </div>
        <div style="margin-top:.7rem;display:flex;gap:.35rem;flex-wrap:wrap;">
          <button class="btn btn-outline" style="font-size:.7rem;padding:.28rem .6rem;" onclick="quickPrompt('Comment améliorer mon scénario ?')">Améliorer scénario</button>
          <button class="btn btn-outline" style="font-size:.7rem;padding:.28rem .6rem;" onclick="quickPrompt('Quels angles de caméra pour une scène dramatique ?')">Angles caméra</button>
          <button class="btn btn-outline" style="font-size:.7rem;padding:.28rem .6rem;" onclick="quickPrompt('Comment financer un court métrage indépendant ?')">Financement</button>
          <button class="btn btn-outline" style="font-size:.7rem;padding:.28rem .6rem;" onclick="quickPrompt('Les meilleurs festivals cinéma indépendant ?')">Festivals</button>
        </div>
      </div>
    </div>

    <!-- OUTILS -->
    <div class="tab" id="tab-outils">
      <div class="card"><div class="card-title">📸 IMAGES IA — GRATUIT</div>
        <div class="grid3">
          <div class="tool-card" onclick="window.open('https://leonardo.ai','_blank')"><div class="tool-icon">🎨</div><div class="tool-name">Leonardo AI</div><div class="tool-desc">150 générations/jour gratuites. Qualité cinéma.</div><span class="tool-badge badge-free">150/JOUR</span></div>
          <div class="tool-card" onclick="window.open('https://www.bing.com/images/create','_blank')"><div class="tool-icon">🖼️</div><div class="tool-name">Bing Image Creator</div><div class="tool-desc">DALL-E 3 gratuit. Illimité avec compte Microsoft.</div><span class="tool-badge badge-free">ILLIMITÉ</span></div>
          <div class="tool-card" onclick="window.open('https://huggingface.co/spaces/stabilityai/stable-diffusion','_blank')"><div class="tool-icon">🤗</div><div class="tool-name">HuggingFace SD</div><div class="tool-desc">Stable Diffusion XL en ligne, sans installation.</div><span class="tool-badge badge-free">GRATUIT</span></div>
        </div>
      </div>
      <div class="card"><div class="card-title">🎬 VIDÉO IA</div>
        <div class="grid3">
          <div class="tool-card" onclick="window.open('https://runwayml.com','_blank')"><div class="tool-icon">🎥</div><div class="tool-name">Runway ML</div><div class="tool-desc">125 crédits gratuits/mois. Gen-3 haute qualité.</div><span class="tool-badge badge-free">125 CRÉDITS</span></div>
          <div class="tool-card" onclick="window.open('https://klingai.com','_blank')"><div class="tool-icon">🎞️</div><div class="tool-name">Kling AI</div><div class="tool-desc">Vidéos 10 sec, qualité cinématographique.</div><span class="tool-badge badge-free">PLAN GRATUIT</span></div>
          <div class="tool-card" onclick="window.open('https://pika.art','_blank')"><div class="tool-icon">⚡</div><div class="tool-name">Pika Labs</div><div class="tool-desc">Animations et effets spéciaux IA rapides.</div><span class="tool-badge badge-free">PLAN GRATUIT</span></div>
        </div>
      </div>
      <div class="card"><div class="card-title">🎵 MUSIQUE & SON</div>
        <div class="grid3">
          <div class="tool-card" onclick="window.open('https://suno.ai','_blank')"><div class="tool-icon">🎵</div><div class="tool-name">Suno AI</div><div class="tool-desc">50 chansons originales/jour gratuitement.</div><span class="tool-badge badge-free">50/JOUR</span></div>
          <div class="tool-card" onclick="window.open('https://udio.com','_blank')"><div class="tool-icon">🎹</div><div class="tool-name">Udio</div><div class="tool-desc">Musique IA haute qualité. Plan gratuit disponible.</div><span class="tool-badge badge-free">PLAN GRATUIT</span></div>
          <div class="tool-card" onclick="window.open('https://elevenlabs.io','_blank')"><div class="tool-icon">🎙️</div><div class="tool-name">ElevenLabs</div><div class="tool-desc">Voix off ultra-réaliste. 10 000 caractères/mois.</div><span class="tool-badge badge-free">10K/MOIS</span></div>
        </div>
      </div>
      <div class="card"><div class="card-title">✂️ MONTAGE — 100% GRATUIT</div>
        <div class="grid3">
          <div class="tool-card" onclick="window.open('https://www.blackmagicdesign.com/fr/products/davinciresolve','_blank')"><div class="tool-icon">🎞️</div><div class="tool-name">DaVinci Resolve</div><div class="tool-desc">Montage professionnel Hollywood. Version gratuite complète.</div><span class="tool-badge badge-free">100% GRATUIT</span></div>
          <div class="tool-card" onclick="window.open('https://kdenlive.org','_blank')"><div class="tool-icon">✂️</div><div class="tool-name">Kdenlive</div><div class="tool-desc">Open source professionnel. Multi-piste, effets.</div><span class="tool-badge badge-free">OPEN SOURCE</span></div>
          <div class="tool-card" onclick="window.open('https://www.openshot.org','_blank')"><div class="tool-icon">🎬</div><div class="tool-name">OpenShot</div><div class="tool-desc">Simple et puissant. Idéal indépendants.</div><span class="tool-badge badge-free">GRATUIT</span></div>
        </div>
      </div>
    </div>

    <!-- CONFIG -->
    <div class="tab" id="tab-config">
      <div class="card"><div class="card-title">INFORMATIONS DU STUDIO</div>
        <div style="font-size:.83rem;line-height:1.9;">
          <div>🎬 <strong style="color:var(--gold)">BENY-JOE CINIE IA</strong> — Studio de Production Cinématographique</div>
          <div>✦ <strong>Fondé par</strong> KHEDIM BENYAKHLEF dit BENY-JOE</div>
          <div>🔒 Clé API : stockée <strong>uniquement côté serveur</strong> (variable d'environnement)</div>
          <div style="margin-top:.5rem;" id="key-status-info">⏳ Vérification...</div>
        </div>
      </div>
      <div class="card" id="admin-section" style="display:none;"><div class="card-title">🔑 CLÉ API — ADMIN</div>
        <p style="font-size:.8rem;color:var(--muted);margin-bottom:.9rem;">La clé est stockée <strong>uniquement sur le serveur</strong>. Elle n'est jamais transmise au navigateur.<br>Obtenez votre clé : <a href="https://console.anthropic.com" target="_blank" style="color:var(--gold);">console.anthropic.com</a></p>
        <div style="display:flex;gap:.5rem;align-items:flex-end;">
          <div style="flex:1"><label>CLÉ API ANTHROPIC</label><input type="password" id="key-admin" placeholder="sk-ant-..."></div>
          <button class="btn btn-gold" onclick="sauvegarderCle()">🔒 Sauvegarder</button>
        </div>
      </div>
      <div class="card"><div class="card-title">PRÉFÉRENCES</div>
        <div class="settings-row"><div class="settings-label">Sauvegarde automatique<div class="settings-hint">Sauvegarder le projet toutes les 5 min</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
        <div class="settings-row" style="border:none;"><div class="settings-label">Notifications<div class="settings-hint">Alertes à chaque génération IA</div></div><div class="toggle" onclick="this.classList.toggle('on')"></div></div>
      </div>
    </div>

  </div>
  <footer>🎬 BENY-JOE CINIE IA · Fondé par <span style="color:var(--gold)">KHEDIM BENYAKHLEF dit BENY-JOE</span> · Studio de Production Cinématographique IA</footer>
</div>

<div class="notif" id="notif"></div>

<script>
// ─── ÉTAT ────────────────────────────────────────────────────────────────────
let scenes=[], chatHistory=[], prodType='court', currentUser=null;

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function switchTab(panel, btn){
  document.querySelectorAll('.auth-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.auth-panel').forEach(p=>p.style.display='none');
  document.getElementById('panel-'+panel).style.display='flex';
}

async function doLogin(){
  const u=document.getElementById('login-user').value.trim();
  const p=document.getElementById('login-pass').value.trim();
  const err=document.getElementById('login-err');
  err.style.display='none';
  if(!u||!p){err.textContent='Remplissez tous les champs';err.style.display='block';return;}
  const btn=document.getElementById('login-btn');
  btn.disabled=true;btn.innerHTML='<span class="loader"></span> Connexion...';
  const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});
  const d=await r.json();
  btn.disabled=false;btn.innerHTML='▶ ENTRER DANS LE STUDIO';
  if(d.error){err.textContent='❌ '+d.error;err.style.display='block';}
  else{localStorage.setItem('bjci_token',d.token);currentUser=d;showApp(d);}
}

async function doRegister(){
  const u=document.getElementById('reg-user').value.trim();
  const name=document.getElementById('reg-name').value.trim();
  const p=document.getElementById('reg-pass').value.trim();
  const p2=document.getElementById('reg-pass2').value.trim();
  const err=document.getElementById('reg-err');
  err.style.display='none';
  if(!u||!name||!p||!p2){err.textContent='Remplissez tous les champs';err.style.display='block';return;}
  if(p.length<6){err.textContent='Mot de passe trop court (min 6 car.)';err.style.display='block';return;}
  if(p!==p2){err.textContent='❌ Mots de passe différents';err.style.display='block';return;}
  const btn=document.getElementById('reg-btn');
  btn.disabled=true;btn.innerHTML='<span class="loader"></span> Inscription...';
  const r=await fetch('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p,name})});
  const d=await r.json();
  btn.disabled=false;btn.innerHTML='✨ CRÉER MON COMPTE';
  if(d.error){err.textContent='❌ '+d.error;err.style.display='block';}
  else{localStorage.setItem('bjci_token',d.token);currentUser=d;showApp(d);}
}

async function doLogout(){
  const t=localStorage.getItem('bjci_token');
  if(t) await fetch('/api/logout',{method:'POST',headers:{Authorization:'Bearer '+t}});
  localStorage.removeItem('bjci_token');
  location.reload();
}

function showApp(user){
  document.getElementById('auth-screen').style.display='none';
  document.getElementById('app').classList.add('visible');
  document.getElementById('user-display').textContent=user.name||user.username;
  if(user.role==='admin') document.getElementById('admin-section').style.display='block';
  checkKeyStatus();
  notif('🎬 Bienvenue '+( user.name||user.username)+' !','success');
}

async function checkKeyStatus(){
  try{
    const t=localStorage.getItem('bjci_token');
    const r=await fetch('/api/key-status',{headers:{Authorization:'Bearer '+t}});
    const d=await r.json();
    const el=document.getElementById('key-status-info');
    el.textContent=d.configured?'✅ Clé API configurée — IA opérationnelle':'⚠️ Aucune clé API — Fonctions IA désactivées';
    el.style.color=d.configured?'var(--green)':'var(--red)';
  }catch(e){}
}

async function sauvegarderCle(){
  const key=document.getElementById('key-admin').value.trim();
  if(!key) return;
  const t=localStorage.getItem('bjci_token');
  const r=await fetch('/api/set-key',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:JSON.stringify({key})});
  const d=await r.json();
  if(d.error){notif('Erreur: '+d.error,'error');}
  else{notif('✅ Clé sécurisée sur le serveur !','success');document.getElementById('key-admin').value='';checkKeyStatus();}
}

// ─── INIT ──────────────────────────────────────────────────────────────────────
window.addEventListener('load',async()=>{
  setupPills();
  const t=localStorage.getItem('bjci_token');
  if(t){
    try{
      const r=await fetch('/api/me',{headers:{Authorization:'Bearer '+t}});
      if(r.ok){const d=await r.json();currentUser=d;showApp(d);return;}
    }catch(e){}
    localStorage.removeItem('bjci_token');
  }
  document.getElementById('auth-screen').style.display='flex';
});

document.getElementById('login-pass').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
document.getElementById('reg-pass2').addEventListener('keydown',e=>{if(e.key==='Enter')doRegister();});

// ─── NAV ───────────────────────────────────────────────────────────────────────
function goTab(id,btn){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
}

function notif(msg,type='success'){
  const el=document.getElementById('notif');
  el.textContent=msg;el.className='notif '+type+' show';
  setTimeout(()=>el.classList.remove('show'),3500);
}

function setupPills(){
  document.querySelectorAll('.type-pills').forEach(c=>{
    c.querySelectorAll('.pill').forEach(p=>{
      p.addEventListener('click',()=>{c.querySelectorAll('.pill').forEach(x=>x.classList.remove('active'));p.classList.add('active');});
    });
  });
}

// ─── API CLAUDE (via backend sécurisé) ───────────────────────────────────────
async function callClaude(prompt,sys){
  const t=localStorage.getItem('bjci_token');
  try{
    const r=await fetch('/api/claude',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:JSON.stringify({messages:[{role:'user',content:prompt}],system:sys||'Tu es un scénariste et réalisateur professionnel. Réponds en français avec style professionnel.',max_tokens:4000})});
    const d=await r.json();
    if(d.error){notif('Erreur IA: '+d.error,'error');return null;}
    return d.text;
  }catch(e){notif('Erreur réseau','error');return null;}
}

// ─── SCÉNARIO ─────────────────────────────────────────────────────────────────
function selectProd(type){
  prodType=type;
  document.querySelectorAll('.prod-type-card').forEach(el=>{el.style.borderColor='';el.style.background='';});
  const map={court:'prod-cm',long:'prod-lm',clip:'prod-clip',doc:'prod-doc',anim:'prod-anim',serie:'prod-serie'};
  const el=document.getElementById(map[type]);
  if(el){el.style.borderColor='var(--gold)';el.style.background='rgba(201,168,76,.08)';}
}

function ajouterPerso(){
  const v=document.getElementById('new-perso').value.trim();if(!v)return;
  const d=document.createElement('div');
  d.style.cssText='display:flex;align-items:center;gap:.4rem;padding:.35rem .65rem;background:#07111e;border-radius:8px;border:1px solid var(--dim);font-size:.8rem;';
  d.innerHTML='<span style="color:var(--gold)">👤</span><span style="flex:1">'+v+'</span><button onclick="this.parentNode.remove()" style="background:none;border:none;color:var(--muted);cursor:pointer;">✕</button>';
  document.getElementById('perso-list').appendChild(d);
  document.getElementById('new-perso').value='';
}

function ajouterScene(titre,type,desc){
  const sc={id:Date.now(),num:scenes.length+1,titre:titre||'',type:type||'INT.',desc:desc||''};
  scenes.push(sc);renderScenes();
  document.getElementById('empty-scenes').style.display='none';
}

function renderScenes(){
  const c=document.getElementById('scenes-container');c.innerHTML='';
  document.getElementById('scenes-count').textContent=scenes.length+' scène(s)';
  scenes.forEach((sc,i)=>{
    const d=document.createElement('div');d.className='scene-item';
    d.innerHTML='<div class="scene-num">'+sc.num+'</div><div style="flex:1"><div style="display:flex;gap:.4rem;margin-bottom:.3rem;"><input value="'+sc.titre.replace(/"/g,'&quot;')+'" placeholder="Titre..." style="flex:1;font-size:.8rem;font-weight:700;" oninput="scenes['+i+'].titre=this.value"><select style="width:110px;font-size:.7rem;" onchange="scenes['+i+'].type=this.value"><option '+(sc.type==='INT.'?'selected':'')+'>INT.</option><option '+(sc.type==='EXT.'?'selected':'')+'>EXT.</option><option '+(sc.type==='INT./EXT.'?'selected':'')+'>INT./EXT.</option></select></div><textarea placeholder="Description..." style="min-height:65px;font-size:.78rem;" oninput="scenes['+i+'].desc=this.value">'+sc.desc+'</textarea></div><div style="display:flex;flex-direction:column;gap:.3rem;"><button class="btn btn-outline" style="font-size:.68rem;padding:.25rem .5rem;" onclick="genererSceneIA('+i+')">🤖</button><button class="btn btn-red" style="font-size:.68rem;padding:.25rem .5rem;" onclick="supprimerScene('+i+')">✕</button></div>';
    c.appendChild(d);
  });
}

function supprimerScene(i){scenes.splice(i,1);scenes.forEach((s,j)=>s.num=j+1);renderScenes();}

async function genererScenario(){
  const synopsis=document.getElementById('synopsis').value.trim();
  if(!synopsis){notif('Écrivez votre synopsis','error');return;}
  notif('🤖 Génération en cours...');
  const titre=document.getElementById('proj-titre').value||'Sans titre';
  const genre=document.getElementById('proj-genre').value;
  const duree=document.getElementById('proj-duree').value;
  const langue=document.getElementById('proj-langue').value;
  const result=await callClaude('Écris un scénario professionnel pour "'+titre+'" — Genre: '+genre+' — Durée: '+duree+' — Langue: '+langue+'\n\nSYNOPSIS: '+synopsis+'\n\nFormat: SCÈNE N — INT./EXT. LIEU — MOMENT\n[Description + Dialogues]\n\nGénère 8 à 15 scènes.');
  if(!result)return;
  scenes=[];
  const lignes=result.split('\n');let cur=null,num=0;
  lignes.forEach(l=>{
    const m=l.match(/SC[EÈ]NE?\s*(\d+)\s*[—–-]\s*(.+)/i);
    if(m){if(cur)scenes.push(cur);num++;cur={id:Date.now()+num,num,titre:m[2].trim(),type:'INT.',desc:''};}
    else if(cur&&l.trim())cur.desc+=(cur.desc?'\n':'')+l;
  });
  if(cur)scenes.push(cur);
  if(scenes.length===0)ajouterScene('Scénario complet','INT.',result.substring(0,800));
  else renderScenes();
  document.getElementById('empty-scenes').style.display='none';
  notif('✅ '+scenes.length+' scènes générées !','success');
}

async function ameliorerSynopsis(){
  const s=document.getElementById('synopsis').value.trim();
  if(!s){notif('Écrivez votre synopsis','error');return;}
  notif('🤖 Amélioration...');
  const r=await callClaude('Améliore ce synopsis de film pour le rendre plus accrocheur et cinématographique:\n\n'+s);
  if(r){document.getElementById('synopsis').value=r;notif('✅ Amélioré !','success');}
}

async function genererPersonnages(){
  const s=document.getElementById('synopsis').value.trim();
  if(!s){notif('Écrivez votre synopsis','error');return;}
  notif('🤖 Génération personnages...');
  const r=await callClaude('Crée 4-6 personnages depuis ce synopsis. Format: Nom | Âge | Rôle | Trait | Arc narratif\n\nSYNOPSIS: '+s);
  if(!r)return;
  const c=document.getElementById('perso-list');c.innerHTML='';
  r.split('\n').filter(l=>l.includes('|')).forEach(l=>{
    const d=document.createElement('div');
    d.style.cssText='display:flex;align-items:center;gap:.4rem;padding:.35rem .65rem;background:#07111e;border-radius:8px;border:1px solid var(--dim);font-size:.76rem;';
    d.innerHTML='<span style="color:var(--gold)">👤</span><span style="flex:1">'+l.trim()+'</span><button onclick="this.parentNode.remove()" style="background:none;border:none;color:var(--muted);cursor:pointer;">✕</button>';
    c.appendChild(d);
  });
  notif('✅ Personnages générés !','success');
}

async function genererSceneIA(i){
  const sc=scenes[i];notif('🤖 Génération scène...');
  const r=await callClaude('Écris cette scène de façon professionnelle:\n\nSCÈNE: '+sc.titre+'\nCONTEXTE: '+(sc.desc||'vide')+'\n\nAvec: description, atmosphère, dialogues.');
  if(r){scenes[i].desc=r;renderScenes();notif('✅ Scène générée !','success');}
}

async function restructurerScenes(){
  if(scenes.length<2){notif('Min 2 scènes requises','error');return;}
  notif('🔄 Restructuration...');
  const txt=scenes.map(s=>s.num+'. '+s.titre+': '+(s.desc||'').substring(0,100)).join('\n');
  const r=await callClaude('Analyse ces scènes et propose un réordonnancement optimal pour un impact dramatique maximal:\n'+txt);
  if(r){document.getElementById('prod-output-card').style.display='block';document.getElementById('prod-output').textContent=r;goTab('tab-production',document.querySelectorAll('.nav-btn')[3]);notif('✅ Suggestions prêtes','success');}
}

// ─── PRODUCTION ───────────────────────────────────────────────────────────────
async function lancerProduction(){
  const style=document.getElementById('style-visuel').value;
  const ratio=document.getElementById('ratio').value;
  const palette=document.getElementById('palette').value;
  const langue=document.getElementById('langue-prod').value;
  const criteres=document.getElementById('prod-criteres').value;
  const synopsis=document.getElementById('synopsis')?.value||'';
  document.getElementById('prod-output-card').style.display='block';
  const prog=document.getElementById('prod-progress');
  const out=document.getElementById('prod-output');
  out.textContent='⏳ Génération...';prog.style.width='25%';
  const r=await callClaude('Crée un PLAN DE PRODUCTION CINÉMATOGRAPHIQUE PROFESSIONNEL:\n\nTYPE: '+prodType.toUpperCase()+'\nSTYLE: '+style+'\nRATIO: '+ratio+'\nPALETTE: '+palette+'\nLANGUE: '+langue+'\nSYNOPSIS: '+synopsis.substring(0,300)+'\nCRITÈRES: '+(criteres||'Standard')+'\n\nInclure: Pré-production, Tournage, Post-production, Outils IA gratuits, Planning 4 semaines.');
  prog.style.width='100%';
  if(r){out.textContent=r;notif('✅ Plan généré !','success');}
}

async function genererPrompts(){
  if(scenes.length===0){notif('Ajoutez des scènes','error');return;}
  notif('🤖 Génération prompts...');
  const txt=scenes.slice(0,8).map(s=>s.num+'. '+s.titre+': '+(s.desc||'').substring(0,150)).join('\n');
  const style=document.getElementById('style-visuel')?.value||'Réaliste';
  const r=await callClaude('Génère des prompts Stable Diffusion pour chaque scène:\n'+txt+'\n\nStyle: '+style+'\nFormat: SCÈNE N: [prompt anglais ultra-détaillé, éclairage, caméra, qualité cinéma]');
  if(r){document.getElementById('prod-output-card').style.display='block';document.getElementById('prod-output').textContent=r;notif('✅ Prompts générés !','success');}
}

async function genererVoixOff(){
  const synopsis=document.getElementById('synopsis')?.value||'';
  if(!synopsis){notif('Écrivez votre synopsis','error');return;}
  notif('🤖 Génération narration...');
  const r=await callClaude('Écris une narration voix off professionnelle pour ce film. Ton cinématographique, évocateur:\n\nSYNOPSIS: '+synopsis+'\nTYPE: '+prodType);
  if(r){document.getElementById('prod-output-card').style.display='block';document.getElementById('prod-output').textContent=r;notif('✅ Narration générée !','success');}
}

// ─── VISUELS ──────────────────────────────────────────────────────────────────
async function genererPromptVisuel(){
  const desc=document.getElementById('vis-desc').value.trim();
  const style=document.getElementById('vis-style').value;
  if(!desc){notif('Décrivez votre scène','error');return;}
  notif('🤖 Génération...');
  const r=await callClaude('Génère un prompt image ultra-optimisé pour Stable Diffusion XL en anglais pour:\n\nDESCRIPTION: '+desc+'\nSTYLE: '+style+'\n\nTrès détaillé: composition, éclairage, caméra, qualité, style artistique. Inclus aussi les negative prompts.');
  if(r){document.getElementById('vis-prompt').textContent=r;notif('✅ Prompt généré !','success');}
}

async function genererStoryboard(){
  if(scenes.length===0){notif('Ajoutez des scènes','error');return;}
  const c=document.getElementById('storyboard-grid');c.innerHTML='';
  notif('🤖 Storyboard...');
  const txt=scenes.map(s=>s.num+'. '+s.titre+': '+(s.desc||'').substring(0,120)).join('\n');
  const style=document.getElementById('style-visuel')?.value||'Cinéma';
  const r=await callClaude('Pour chaque scène génère un prompt Stable Diffusion. Format: SCÈNE N|prompt_anglais\n\n'+txt+'\nStyle: '+style);
  if(!r)return;
  r.split('\n').filter(l=>l.includes('|')).forEach((line,i)=>{
    const [label,prompt]=line.split('|');
    const d=document.createElement('div');
    d.style.cssText='background:#07111e;border:1px solid var(--dim);border-radius:10px;padding:.9rem;';
    d.innerHTML='<div style="font-size:.7rem;color:var(--gold);font-weight:700;margin-bottom:.35rem;">'+(label?.trim()||'SCÈNE '+(i+1))+'</div><div style="font-size:.7rem;color:var(--muted);line-height:1.4;margin-bottom:.5rem;">'+(prompt?.trim()||'')+'</div><button class="btn btn-outline" style="font-size:.66rem;padding:.2rem .5rem;width:100%;" onclick="navigator.clipboard.writeText(\''+((prompt||'').replace(/'/g,"\\'"))+'\');notif(\'Copié !\',\'success\')">📋 Copier</button>';
    c.appendChild(d);
  });
  notif('✅ Storyboard généré !','success');
}

// ─── IMPORT ───────────────────────────────────────────────────────────────────
function chargerFichier(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{document.getElementById('import-text').value=e.target.result.substring(0,10000);notif('📂 Fichier chargé !','success');};
  reader.readAsText(file,'UTF-8');
}

async function analyserTexte(){
  const text=document.getElementById('import-text').value.trim();
  const type=document.getElementById('import-type').value;
  const adapt=document.getElementById('import-adapt').value;
  if(!text){notif('Importez ou collez un texte','error');return;}
  notif('🔍 Analyse...');
  const r=await callClaude('Analyse ce texte et adapte-le en scénario cinéma.\nTYPE: '+type+'\nADAPTATION: '+adapt+'\n\nTEXTE:\n'+text.substring(0,3000)+'\n\nExtrait: personnages, scènes clés, dialogues, structure narrative.');
  if(r){document.getElementById('import-result').style.display='block';document.getElementById('import-output').textContent=r;notif('✅ Analyse terminée !','success');}
}

function importerVersScenario(){
  const text=document.getElementById('import-output').textContent;
  if(!text)return;
  document.getElementById('synopsis').value=text.substring(0,1000);
  goTab('tab-scenario',document.querySelectorAll('.nav-btn')[1]);
  notif('✅ Envoyé vers Scénario !','success');
}

// ─── MONTAGE ──────────────────────────────────────────────────────────────────
function ajouterClip(){
  const nom=prompt('Nom du clip:');if(!nom)return;
  const t=document.getElementById('timeline-video');
  const c=document.createElement('div');c.className='tl-clip';
  c.innerHTML='<span>'+nom+'</span><span style="font-size:.6rem;color:var(--muted);">VIDEO</span>';
  t.appendChild(c);
}

function ajouterMusique(){
  const nom=prompt('Titre musique:');if(!nom)return;
  const t=document.getElementById('timeline-audio');
  const c=document.createElement('div');c.className='tl-clip';
  c.style.cssText='background:rgba(74,158,255,.15);border-color:rgba(74,158,255,.3);';
  c.innerHTML='<span style="color:var(--blue)">'+nom+'</span><span style="font-size:.6rem;color:var(--muted);">AUDIO</span>';
  t.appendChild(c);
}

async function genererMontage(){
  const synopsis=document.getElementById('synopsis')?.value||'';
  notif('🤖 Conseils montage...');
  const r=await callClaude('Recommandations de montage professionnel:\nFilm: '+prodType+' — Scènes: '+scenes.length+'\nSynopsis: '+(synopsis.substring(0,300)||'Non défini')+'\n\nConseils: rythme, transitions, ordre, musique, longueur des plans.');
  if(r){document.getElementById('montage-suggestions').textContent=r;notif('✅ Recommandations prêtes !','success');}
}

// ─── CHAT ─────────────────────────────────────────────────────────────────────
async function envoyerMessage(){
  const input=document.getElementById('chat-input');
  const msg=input.value.trim();if(!msg)return;
  input.value='';
  const box=document.getElementById('chat-box');
  box.innerHTML+='<div class="msg msg-user"><div class="msg-name">VOUS</div>'+msg+'</div>';
  const loading=document.createElement('div');loading.className='msg msg-ai';
  loading.innerHTML='<div class="msg-name">🎬 BENY-JOE CINIE IA</div><span class="loader"></span>';
  box.appendChild(loading);box.scrollTop=box.scrollHeight;
  chatHistory.push({role:'user',content:msg});
  const mode=document.querySelector('#mode-pills .pill.active')?.textContent||'Libre';
  const synopsis=document.getElementById('synopsis')?.value||'';
  const sys='Tu es BENY-JOE CINIE IA, assistant cinéma professionnel fondé par KHEDIM BENYAKHLEF dit BENY-JOE. Mode: '+mode+(synopsis?'. Projet: '+synopsis.substring(0,200):'')+'. Réponds en français de façon professionnelle et créative.';
  const t=localStorage.getItem('bjci_token');
  try{
    const r=await fetch('/api/claude',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:JSON.stringify({messages:chatHistory.slice(-10),system:sys,max_tokens:2000})});
    const d=await r.json();loading.remove();
    if(d.text){chatHistory.push({role:'assistant',content:d.text});box.innerHTML+='<div class="msg msg-ai"><div class="msg-name">🎬 BENY-JOE CINIE IA</div>'+d.text.replace(/\n/g,'<br>')+'</div>';}
    else{notif('Erreur IA: '+(d.error||'inconnue'),'error');}
  }catch(e){loading.remove();notif('Erreur réseau','error');}
  box.scrollTop=box.scrollHeight;
}

function quickPrompt(p){document.getElementById('chat-input').value=p;envoyerMessage();}
function effacerChat(){chatHistory=[];document.getElementById('chat-box').innerHTML='<div class="msg msg-ai"><div class="msg-name">🎬 BENY-JOE CINIE IA</div>Chat effacé. Comment puis-je vous aider ?</div>';}
document.getElementById('chat-input').addEventListener('keydown',e=>{if(e.key==='Enter')envoyerMessage();});

// ─── EXPORTS ──────────────────────────────────────────────────────────────────
function exporterScript(){
  if(scenes.length===0){notif('Aucune scène','error');return;}
  const titre=document.getElementById('proj-titre')?.value||'Scénario';
  let txt='BENY-JOE CINIE IA\\nFondé par KHEDIM BENYAKHLEF dit BENY-JOE\\n\\n'+titre.toUpperCase()+'\\n\\n'+new Date().toLocaleDateString('fr-FR')+'\\n\\n'+'='.repeat(50)+'\\n\\n';
  scenes.forEach(s=>{txt+='SCÈNE '+s.num+' — '+s.titre+'\\n\\n'+(s.desc||'')+'\\n\\n'+'-'.repeat(40)+'\\n\\n';});
  downloadTxt(txt,(titre||'scenario')+'_script.txt');
  notif('✅ Script exporté !','success');
}

function exporterTxt(id,filename){
  const el=document.getElementById(id);if(!el||!el.textContent.trim()){notif('Rien à exporter','error');return;}
  downloadTxt(el.textContent,filename);notif('✅ Exporté !','success');
}

function downloadTxt(content,filename){
  const blob=new Blob([content],{type:'text/plain;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();
}

function copier(id){
  const el=document.getElementById(id);if(!el)return;
  navigator.clipboard.writeText(el.textContent);notif('📋 Copié !','success');
}
</script>
</body>
</html>`;

// ─── SERVEUR HTTP ─────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path_ = url.pathname;
  const method = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  const json = (d, code = 200) => { res.writeHead(code, {'Content-Type':'application/json'}); res.end(JSON.stringify(d)); };

  // ─── API ──────────────────────────────────────────────────────────────────
  if (path_ === '/api/register' && method === 'POST') {
    const { username, password, name } = await parseBody(req);
    if (!username || !password || username.length < 3 || password.length < 6)
      return json({ error: 'Identifiant (min 3) et mot de passe (min 6) requis' }, 400);
    const users = loadJ(USERS_F, {});
    if (users[username]) return json({ error: 'Nom d\'utilisateur déjà pris' }, 409);
    users[username] = { username, password: hashPwd(password), role: 'user', name: name || username };
    saveJ(USERS_F, users);
    const token = createSession(username);
    return json({ success: true, token, username, name: users[username].name, role: 'user' });
  }

  if (path_ === '/api/login' && method === 'POST') {
    const { username, password } = await parseBody(req);
    const users = loadJ(USERS_F, {});
    const user = users[username];
    if (!user || user.password !== hashPwd(password)) return json({ error: 'Identifiants incorrects' }, 401);
    const token = createSession(username);
    return json({ success: true, token, username, name: user.name, role: user.role });
  }

  if (path_ === '/api/logout' && method === 'POST') {
    const sessions = loadJ(SESS_F, {});
    delete sessions[getToken(req)];
    saveJ(SESS_F, sessions);
    return json({ success: true });
  }

  if (path_ === '/api/me' && method === 'GET') {
    const username = validateSession(getToken(req));
    if (!username) return json({ error: 'Non authentifié' }, 401);
    const users = loadJ(USERS_F, {});
    const user = users[username];
    return json({ username, name: user?.name, role: user?.role });
  }

  if (path_ === '/api/key-status' && method === 'GET') {
    const username = validateSession(getToken(req));
    if (!username) return json({ error: 'Non authentifié' }, 401);
    const key = getApiKey();
    return json({ configured: !!key, partial: key ? key.substring(0, 12) + '...' : null });
  }

  if (path_ === '/api/set-key' && method === 'POST') {
    const username = validateSession(getToken(req));
    if (!username) return json({ error: 'Non authentifié' }, 401);
    const users = loadJ(USERS_F, {});
    if (users[username]?.role !== 'admin') return json({ error: 'Admin requis' }, 403);
    const { key } = await parseBody(req);
    if (!key || !key.startsWith('sk-ant-')) return json({ error: 'Clé invalide (doit commencer par sk-ant-)' }, 400);
    setApiKey(key);
    return json({ success: true });
  }

  if (path_ === '/api/claude' && method === 'POST') {
    const username = validateSession(getToken(req));
    if (!username) return json({ error: 'Non authentifié' }, 401);
    const apiKey = getApiKey();
    if (!apiKey) return json({ error: 'Clé API non configurée. Contactez l\'administrateur.' }, 503);
    const body = await parseBody(req);
    const { messages, system, model = 'claude-haiku-4-5-20251001', max_tokens = 4000 } = body;
    if (!messages) return json({ error: 'Messages requis' }, 400);
    const payload = JSON.stringify({ model, max_tokens, messages, ...(system ? { system } : {}) });
    return new Promise(resolve => {
      const opts = {
        hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Length': Buffer.byteLength(payload) }
      };
      const apiReq = https.request(opts, apiRes => {
        let data = '';
        apiRes.on('data', c => data += c);
        apiRes.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) { res.writeHead(502,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:parsed.error.message})); }
            else { res.writeHead(200,{'Content-Type':'application/json'}); res.end(JSON.stringify({text:parsed.content?.[0]?.text||''})); }
          } catch(e) { res.writeHead(500,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:'Erreur parsing'})); }
          resolve();
        });
      });
      apiReq.on('error', e => { res.writeHead(502,{'Content-Type':'application/json'}); res.end(JSON.stringify({error:e.message})); resolve(); });
      apiReq.write(payload); apiReq.end();
    });
  }

  // ─── FRONTEND (page principale) ───────────────────────────────────────────
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(HTML);
});

initAdmin();
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║       🎬  BENY-JOE CINIE IA — STUDIO            ║
  ║   Fondé par KHEDIM BENYAKHLEF dit BENY-JOE       ║
  ╠══════════════════════════════════════════════════╣
  ║  Serveur : http://localhost:${PORT}                 ║
  ║  Clé API : variable ANTHROPIC_API_KEY            ║
  ╚══════════════════════════════════════════════════╝
  `);
});
