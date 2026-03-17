/**
 * BENY-JOE CINIE IA — v4 ULTIMATE
 * Fondé par KHEDIM BENYAKHLEF dit BENY-JOE
 * Propulsé par Google Gemini 2.0 Flash
 * Plan gratuit Gemini : 1500 requêtes/jour — 100% GRATUIT
 */

'use strict';
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PORT = process.env.PORT || 3000;

const DATA_DIR = process.env.RENDER
  ? '/opt/render/project/src/_data'
  : path.join(__dirname, '_data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const CFG_F      = path.join(DATA_DIR, 'config.json');
const EXPORTS_DIR = path.join(DATA_DIR, 'exports');
if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });

function loadJ(f, d) {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); }
  catch(e) { return d; }
}
function saveJ(f, d) { fs.writeFileSync(f, JSON.stringify(d, null, 2)); }
function getKey() { return process.env.GEMINI_API_KEY || loadJ(CFG_F, {}).key || ''; }
function setKey(k) { const c = loadJ(CFG_F, {}); c.key = k; saveJ(CFG_F, c); }

function readBody(req) {
  return new Promise(function(ok) {
    var s = '';
    var timeout = setTimeout(function(){ ok({}); }, 30000);
    req.on('data', function(c) { s += c; });
    req.on('end', function() {
      clearTimeout(timeout);
      try { ok(JSON.parse(s)); } catch(e) { ok({}); }
    });
    req.on('error', function(){ clearTimeout(timeout); ok({}); });
  });
}

// ─── APPEL API GEMINI 2.0 FLASH ───────────────────────────────────────────────
function callGemini(apiKey, messages, system) {
  return new Promise(function(ok, fail) {
    var contents = [];

    if (system) {
      contents.push({ role: 'user', parts: [{ text: 'INSTRUCTIONS SYSTÈME : ' + system }] });
      contents.push({ role: 'model', parts: [{ text: 'Compris. Je vais suivre ces instructions à la lettre.' }] });
    }

    messages.forEach(function(m) {
      contents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      });
    });

    var payload = JSON.stringify({
      contents: contents,
      generationConfig: {
        temperature: 0.82,
        maxOutputTokens: 8192,
        topP: 0.95
      }
    });

    var model   = 'gemini-2.0-flash';
    var reqPath = '/v1beta/models/' + model + ':generateContent?key=' + apiKey;

    var options = {
      hostname: 'generativelanguage.googleapis.com',
      path: reqPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    var apiReq = https.request(options, function(apiRes) {
      var data = '';
      apiRes.on('data', function(c) { data += c; });
      apiRes.on('end', function() {
        try { ok(JSON.parse(data)); }
        catch(e) { fail(new Error('Erreur parsing réponse Gemini')); }
      });
    });

    apiReq.on('error', fail);
    apiReq.setTimeout(60000, function(){ apiReq.destroy(new Error('Timeout')); });
    apiReq.write(payload);
    apiReq.end();
  });
}

// ─── SAUVEGARDE EXPORT FICHIER ────────────────────────────────────────────────
function saveExport(name, content) {
  var ts   = Date.now();
  var file = path.join(EXPORTS_DIR, ts + '_' + name);
  fs.writeFileSync(file, content, 'utf8');
  return ts + '_' + name;
}

function listExports() {
  try {
    return fs.readdirSync(EXPORTS_DIR).map(function(f) {
      var full = path.join(EXPORTS_DIR, f);
      var stat = fs.statSync(full);
      return { name: f, size: stat.size, date: stat.mtimeMs };
    }).sort(function(a,b){ return b.date - a.date; });
  } catch(e) { return []; }
}

// ─── PAGE HTML ────────────────────────────────────────────────────────────────
var PAGE = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>BENY-JOE CINIE IA — Studio Ultime v4</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;700;900&family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='30' fill='%23060a10' stroke='%23c9a84c' stroke-width='2.5'/><text x='32' y='40' font-size='16' font-weight='900' fill='%23c9a84c' text-anchor='middle' font-family='serif'>BJ</text></svg>">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --gold:#c9a84c;--gold2:#f0d070;--gold3:#fff0b0;
  --bg:#060a10;--bg2:#0b1220;--bg3:#0f1a2e;--bg4:#111e33;
  --tx:#e2e8f0;--mu:#8096b0;--dim:#2a3d52;
  --red:#e05555;--grn:#3db880;--blu:#4a9eff;--pur:#9b7fe8;
  --bord:rgba(201,168,76,.18);--bord2:rgba(201,168,76,.35);
  --ra:12px;--ra2:8px;
  --sh:0 4px 24px rgba(0,0,0,.45);
  --sh2:0 0 0 1px rgba(201,168,76,.12),0 8px 32px rgba(0,0,0,.6);
}
html{scroll-behavior:smooth}
body{font-family:'Lato',sans-serif;background:var(--bg);color:var(--tx);min-height:100vh;overflow-x:hidden}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:#07111e}
::-webkit-scrollbar-thumb{background:var(--dim);border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:var(--gold)}

/* ── HEADER ─────────────────────────────────────────── */
#hdr{
  background:rgba(6,10,16,.96);
  border-bottom:1px solid var(--bord);
  padding:.65rem 1.4rem;
  display:flex;align-items:center;gap:1rem;
  position:sticky;top:0;z-index:100;
  backdrop-filter:blur(12px);
}
.brand{cursor:pointer;flex-shrink:0}
.logo{font-family:'Cinzel',serif;font-size:1.1rem;font-weight:900;
  background:linear-gradient(135deg,var(--gold),var(--gold3));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  letter-spacing:3px;line-height:1.2}
.logo-sub{font-size:.5rem;color:var(--mu);letter-spacing:2.5px;text-transform:uppercase}
#nav{display:flex;gap:.15rem;flex-wrap:wrap;flex:1;justify-content:center}
.nb{
  padding:.38rem .7rem;border:1px solid transparent;border-radius:20px;
  background:transparent;color:var(--mu);font-size:.68rem;font-weight:700;
  cursor:pointer;letter-spacing:.5px;transition:.15s;font-family:'Lato',sans-serif;
  white-space:nowrap
}
.nb:hover{background:rgba(201,168,76,.1);border-color:var(--bord);color:var(--gold)}
.nb.on{background:rgba(201,168,76,.15);border-color:var(--bord2);color:var(--gold)}
.hdr-right{display:flex;align-items:center;gap:.6rem;flex-shrink:0}
.live-dot{width:7px;height:7px;border-radius:50%;background:var(--grn);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(61,184,128,.4)}50%{opacity:.7;box-shadow:0 0 0 5px rgba(61,184,128,0)}}
.live-txt{font-size:.66rem;color:var(--mu);display:flex;align-items:center;gap:.35rem}
#ai-status-badge{font-size:.6rem;padding:.15rem .5rem;border-radius:10px;font-weight:700;background:rgba(224,85,85,.15);border:1px solid rgba(224,85,85,.3);color:var(--red)}
#ai-status-badge.ok{background:rgba(61,184,128,.15);border-color:rgba(61,184,128,.3);color:var(--grn)}

/* ── LAYOUT ─────────────────────────────────────────── */
.main{padding:1.4rem 1.6rem;max-width:1600px;margin:0 auto}
@media(max-width:700px){.main{padding:.7rem .6rem}#nav{display:none}}
.tab{display:none}.tab.on{display:block;animation:fadeIn .22s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

/* ── CARDS ─────────────────────────────────────────── */
.card{
  background:var(--bg2);border:1px solid var(--bord);
  border-radius:var(--ra);padding:1.3rem;margin-bottom:1.2rem;
  box-shadow:var(--sh)
}
.card-hd{
  font-family:'Cinzel',serif;font-size:.82rem;color:var(--gold);
  letter-spacing:2px;margin-bottom:1.1rem;
  display:flex;align-items:center;gap:.55rem
}
.card-hd::before{content:'';width:3px;height:14px;background:linear-gradient(var(--gold),var(--gold2));border-radius:2px;flex-shrink:0}

/* ── GRIDS ─────────────────────────────────────────── */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:.9rem}
@media(max-width:900px){.g3,.g4{grid-template-columns:1fr 1fr}}
@media(max-width:560px){.g2,.g3,.g4{grid-template-columns:1fr}}

/* ── FORMS ─────────────────────────────────────────── */
label{font-size:.7rem;color:var(--mu);display:block;margin-bottom:.32rem;letter-spacing:.5px;text-transform:uppercase}
input,select,textarea{
  width:100%;background:#060d1a;border:1px solid var(--dim);
  border-radius:var(--ra2);padding:.62rem .85rem;color:var(--tx);
  font-size:.83rem;font-family:'Lato',sans-serif;outline:none;
  transition:.15s;resize:vertical
}
input:focus,select:focus,textarea:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(201,168,76,.1)}
input::placeholder,textarea::placeholder{color:#3a4f66}
textarea{min-height:100px;line-height:1.6}
select option{background:#0b1220}

/* ── BUTTONS ─────────────────────────────────────────── */
.btn{
  padding:.55rem 1.1rem;border-radius:var(--ra2);border:none;
  cursor:pointer;font-size:.76rem;font-weight:700;letter-spacing:.4px;
  transition:.18s;display:inline-flex;align-items:center;gap:.38rem;
  font-family:'Lato',sans-serif;user-select:none;white-space:nowrap
}
.btn:active{transform:scale(.96)}
.btn:disabled{opacity:.35;cursor:not-allowed;pointer-events:none}
.btn-gold{background:linear-gradient(135deg,#7a5512,var(--gold));color:#0d0a02}
.btn-gold:hover{filter:brightness(1.15);box-shadow:0 4px 16px rgba(201,168,76,.3)}
.btn-out{background:transparent;border:1px solid var(--dim);color:var(--tx)}
.btn-out:hover{border-color:var(--gold);color:var(--gold)}
.btn-red{background:rgba(224,85,85,.12);border:1px solid rgba(224,85,85,.3);color:var(--red)}
.btn-grn{background:rgba(61,184,128,.12);border:1px solid rgba(61,184,128,.3);color:var(--grn)}
.btn-blu{background:rgba(74,158,255,.12);border:1px solid rgba(74,158,255,.3);color:var(--blu)}
.btn-sm{padding:.3rem .65rem;font-size:.68rem}
.btn-full{width:100%;justify-content:center}

/* ── PILLS ─────────────────────────────────────────── */
.pills{display:flex;flex-wrap:wrap;gap:.32rem;margin-bottom:.85rem}
.pill{
  padding:.3rem .72rem;border-radius:20px;border:1px solid var(--dim);
  font-size:.7rem;cursor:pointer;color:var(--mu);transition:.15s;background:transparent
}
.pill:hover,.pill.on{background:rgba(201,168,76,.13);border-color:var(--bord2);color:var(--gold)}

/* ── OUTPUT BOXES ─────────────────────────────────── */
.out-box{
  background:#040a14;border:1px solid var(--dim);border-radius:var(--ra2);
  padding:1rem;min-height:130px;font-size:.8rem;line-height:1.7;
  color:var(--tx);white-space:pre-wrap;word-break:break-word;
  position:relative;overflow:auto;max-height:500px
}
.out-box.loading::after{
  content:'';position:absolute;bottom:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,transparent,var(--gold),transparent);
  animation:loading 1.5s ease-in-out infinite
}
@keyframes loading{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
.out-actions{display:flex;gap:.4rem;margin-top:.55rem;flex-wrap:wrap}

/* ── PROGRESS BAR ─────────────────────────────────── */
.pb-wrap{height:4px;background:var(--dim);border-radius:2px;margin:.7rem 0;overflow:hidden}
.pb-fill{height:100%;background:linear-gradient(90deg,var(--gold),var(--gold3));border-radius:2px;transition:width .5s;width:0}

/* ── TILE CARDS ─────────────────────────────────────── */
.tc{
  background:var(--bg3);border:1px solid var(--dim);border-radius:var(--ra);
  padding:1.1rem;cursor:pointer;transition:.18s;text-align:center
}
.tc:hover{border-color:var(--gold);transform:translateY(-3px);box-shadow:0 8px 24px rgba(201,168,76,.15)}
.tc.sel{border-color:var(--gold);background:rgba(201,168,76,.08)}
.tc-icon{font-size:1.7rem;margin-bottom:.45rem}
.tc-name{font-size:.82rem;font-weight:700;color:var(--tx);margin-bottom:.22rem}
.tc-desc{font-size:.68rem;color:var(--mu);line-height:1.42}
.badge{font-size:.58rem;padding:.12rem .42rem;border-radius:5px;margin-top:.35rem;display:inline-block;font-weight:700}
.badge-grn{background:rgba(61,184,128,.15);border:1px solid rgba(61,184,128,.3);color:var(--grn)}
.badge-blu{background:rgba(74,158,255,.15);border:1px solid rgba(74,158,255,.3);color:var(--blu)}
.badge-gold{background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.3);color:var(--gold)}
.badge-pur{background:rgba(155,127,232,.15);border:1px solid rgba(155,127,232,.3);color:var(--pur)}

/* ── SCENES ─────────────────────────────────────────── */
.scene-item{
  background:#07111e;border:1px solid var(--dim);border-radius:10px;
  padding:.9rem;margin-bottom:.65rem;display:flex;gap:.7rem;
  transition:.15s
}
.scene-item:hover{border-color:var(--bord)}
.scene-num{
  min-width:28px;height:28px;border-radius:50%;
  background:rgba(201,168,76,.13);border:1px solid var(--bord);
  display:flex;align-items:center;justify-content:center;
  font-size:.7rem;color:var(--gold);font-weight:900;flex-shrink:0
}
.scene-body{flex:1;display:flex;flex-direction:column;gap:.38rem}
.scene-row{display:flex;gap:.38rem}

/* ── CHAT ─────────────────────────────────────────── */
.chat-wrap{background:#060d1a;border:1px solid var(--dim);border-radius:10px;padding:.85rem;height:350px;overflow-y:auto;display:flex;flex-direction:column;gap:.55rem}
.msg{padding:.65rem .9rem;border-radius:10px;max-width:86%;font-size:.81rem;line-height:1.55}
.msg-ai{background:var(--bg3);border:1px solid var(--bord);align-self:flex-start}
.msg-user{background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.2);align-self:flex-end}
.msg-name{font-size:.62rem;font-weight:700;margin-bottom:.18rem;letter-spacing:.5px}
.msg-ai .msg-name{color:var(--gold)}.msg-user .msg-name{color:var(--mu)}
.chat-input-row{display:flex;gap:.45rem;margin-top:.65rem}
.chat-input-row input{flex:1}

/* ── TIMELINE ─────────────────────────────────────── */
.tl-track{display:flex;gap:3px;overflow-x:auto;background:#04090f;border:1px solid var(--dim);border-radius:7px;padding:.45rem;min-height:56px;align-items:center}
.clip{
  background:rgba(201,168,76,.18);border:1px solid var(--bord);border-radius:4px;
  height:40px;min-width:80px;padding:.22rem .45rem;font-size:.62rem;
  color:var(--gold);cursor:pointer;display:flex;flex-direction:column;
  justify-content:space-between;position:relative;user-select:none
}
.clip:hover{background:rgba(201,168,76,.28)}
.clip-del{position:absolute;top:2px;right:3px;background:none;border:none;color:var(--mu);cursor:pointer;font-size:.65rem;opacity:0;transition:.12s}
.clip:hover .clip-del{opacity:1}
.clip-audio{background:rgba(74,158,255,.15);border-color:rgba(74,158,255,.3);color:var(--blu)}
.tl-lbl{font-size:.66rem;color:var(--mu);margin-bottom:.28rem}

/* ── STORYBOARD ─────────────────────────────────────── */
.sb-card{background:#07111e;border:1px solid var(--dim);border-radius:10px;padding:.9rem;transition:.15s}
.sb-card:hover{border-color:var(--bord)}
.sb-num{font-size:.65rem;color:var(--gold);font-weight:700;margin-bottom:.32rem;letter-spacing:.5px}
.sb-prompt{font-size:.68rem;color:var(--mu);line-height:1.5;margin-bottom:.5rem;word-break:break-word}

/* ── PRODUITS FINAUX ─────────────────────────────────── */
.product-card{
  background:var(--bg3);border:1px solid var(--bord);border-radius:var(--ra);
  padding:1.2rem;transition:.2s;position:relative;overflow:hidden
}
.product-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,transparent,var(--gold),transparent);
  opacity:0;transition:.2s
}
.product-card:hover::before{opacity:1}
.product-card:hover{border-color:var(--bord2);box-shadow:0 8px 32px rgba(0,0,0,.4)}
.product-type{font-size:.58rem;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:.5rem}
.product-title{font-family:'Cinzel',serif;font-size:.95rem;color:var(--tx);margin-bottom:.35rem;line-height:1.3}
.product-meta{font-size:.7rem;color:var(--mu);margin-bottom:.8rem;line-height:1.6}
.product-preview{
  background:#04090f;border:1px solid var(--dim);border-radius:var(--ra2);
  padding:.85rem;min-height:100px;font-size:.73rem;line-height:1.6;
  color:var(--tx);white-space:pre-wrap;word-break:break-word;
  max-height:200px;overflow-y:auto;margin-bottom:.8rem
}
.product-actions{display:flex;gap:.38rem;flex-wrap:wrap}
.product-empty{
  text-align:center;padding:3rem;color:var(--dim);
  grid-column:1/-1
}
.product-empty-icon{font-size:3rem;margin-bottom:.8rem}
.product-empty-txt{font-size:.82rem}

/* ── EXPORT VIEWER ─────────────────────────────────── */
.export-row{
  display:flex;align-items:center;gap:.8rem;padding:.75rem;
  background:var(--bg3);border:1px solid var(--bord);border-radius:var(--ra2);
  margin-bottom:.5rem;transition:.15s
}
.export-row:hover{border-color:var(--bord2)}
.export-icon{font-size:1.3rem;flex-shrink:0}
.export-info{flex:1}
.export-name{font-size:.8rem;font-weight:700;color:var(--tx);word-break:break-all}
.export-meta{font-size:.68rem;color:var(--mu);margin-top:.12rem}
.export-acts{display:flex;gap:.35rem}

/* ── SETTINGS ─────────────────────────────────────── */
.srow{display:flex;align-items:center;padding:.75rem 0;border-bottom:1px solid rgba(255,255,255,.05)}
.srow:last-child{border:none}
.slabel{flex:1;font-size:.83rem}
.sdesc{font-size:.7rem;color:var(--mu);margin-top:.1rem}
.toggle{width:38px;height:20px;background:var(--dim);border-radius:10px;position:relative;cursor:pointer;transition:.2s;flex-shrink:0}
.toggle.on{background:var(--gold)}
.toggle::after{content:'';position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:.2s}
.toggle.on::after{left:20px}

/* ── MISC ─────────────────────────────────────────── */
.hr{border:none;height:1px;background:linear-gradient(90deg,transparent,var(--bord),transparent);margin:.9rem 0}
.tag{padding:.14rem .48rem;border-radius:5px;font-size:.64rem;background:rgba(255,255,255,.05);border:1px solid var(--dim);color:var(--mu)}
.step-bar{display:flex;overflow-x:auto;margin-bottom:1.3rem;border-bottom:1px solid var(--dim)}
.step-item{flex:1;min-width:65px;padding:.5rem .3rem;text-align:center;font-size:.65rem;color:var(--mu);border-bottom:2px solid transparent;transition:.15s;cursor:pointer}
.step-item.on{color:var(--gold);border-bottom-color:var(--gold);font-weight:700}
.dz{border:2px dashed var(--dim);border-radius:10px;padding:1.8rem;text-align:center;cursor:pointer;transition:.15s;color:var(--mu);font-size:.8rem}
.dz:hover{border-color:var(--gold);color:var(--gold)}
.dz input{display:none}
footer{text-align:center;padding:.8rem;font-size:.65rem;color:var(--dim);border-top:1px solid var(--bord);margin-top:1.2rem}
.ld{display:inline-block;width:13px;height:13px;border:2px solid var(--dim);border-top-color:var(--gold);border-radius:50%;animation:spin .65s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* ── NOTIF TOAST ─────────────────────────────────── */
#notif{
  position:fixed;top:1.1rem;right:1.3rem;
  background:var(--bg2);border:1px solid var(--bord);border-radius:10px;
  padding:.72rem 1.1rem;font-size:.77rem;z-index:9999;
  transform:translateX(140%);transition:.28s cubic-bezier(.34,1.56,.64,1);
  max-width:300px;pointer-events:none;box-shadow:var(--sh)
}
#notif.show{transform:translateX(0)}
#notif.ok{border-color:rgba(61,184,128,.4);color:var(--grn)}
#notif.err{border-color:rgba(224,85,85,.4);color:var(--red)}

/* ── MODAL ─────────────────────────────────────────── */
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9000;display:none;align-items:center;justify-content:center;padding:1rem}
.modal-bg.open{display:flex;animation:fadeIn .18s ease}
.modal{background:var(--bg2);border:1px solid var(--bord2);border-radius:var(--ra);padding:1.5rem;max-width:700px;width:100%;max-height:80vh;overflow-y:auto;box-shadow:var(--sh2)}
.modal-hd{font-family:'Cinzel',serif;color:var(--gold);font-size:.95rem;margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between}
.modal-close{background:none;border:none;color:var(--mu);cursor:pointer;font-size:1.1rem;transition:.15s}
.modal-close:hover{color:var(--red)}
.modal-body{font-size:.83rem;line-height:1.72;white-space:pre-wrap;word-break:break-word;color:var(--tx)}

/* ── ACCUEIL HERO ─────────────────────────────────── */
.hero{
  text-align:center;padding:2rem 0 1.8rem;
  background:radial-gradient(ellipse at 50% 0%, rgba(201,168,76,.06) 0%, transparent 70%);
  border-radius:var(--ra);margin-bottom:1.2rem
}
.hero-logo{font-family:'Cinzel Decorative',serif;font-size:clamp(1.4rem,4vw,2.4rem);font-weight:900;
  background:linear-gradient(135deg,var(--gold),var(--gold3),var(--gold));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  letter-spacing:4px;line-height:1.25;margin-bottom:.4rem}
.hero-sub{font-size:.72rem;color:var(--mu);letter-spacing:3px;text-transform:uppercase;margin-bottom:.6rem}
.hero-author{font-size:.6rem;color:var(--gold);opacity:.6;letter-spacing:2px;margin-bottom:1rem}
.hero-tags{display:flex;gap:.35rem;justify-content:center;flex-wrap:wrap;margin-bottom:1rem}
</style>
</head>
<body>

<div id="hdr">
  <div class="brand" onclick="show('home')">
    <div class="logo">🎬 BENY-JOE CINIE IA</div>
    <div class="logo-sub">Studio v4 Ultimate · Gemini 2.0</div>
  </div>
  <div id="nav">
    <button class="nb on"  onclick="show('home',this)">🏠 Accueil</button>
    <button class="nb"     onclick="show('scen',this)">📝 Scénario</button>
    <button class="nb"     onclick="show('imp', this)">📚 Import</button>
    <button class="nb"     onclick="show('prod',this)">🎬 Production</button>
    <button class="nb"     onclick="show('vis', this)">🖼️ Visuels</button>
    <button class="nb"     onclick="show('mont',this)">✂️ Montage</button>
    <button class="nb"     onclick="show('chat',this)">🤖 Assistant</button>
    <button class="nb"     onclick="show('export',this)">📦 Produits Finaux</button>
    <button class="nb"     onclick="show('outils',this)">🛠️ Outils</button>
    <button class="nb"     onclick="show('cfg', this)">⚙️ Config</button>
  </div>
  <div class="hdr-right">
    <span id="ai-status-badge">IA INACTIF</span>
    <div class="live-txt"><span class="live-dot"></span>Studio actif</div>
  </div>
</div>

<div class="main">

<!-- ══════════════════════ ACCUEIL ══════════════════════ -->
<div id="tab-home" class="tab on">
  <div class="hero">
    <div class="hero-logo">🎬 BENY-JOE CINIE IA</div>
    <div class="hero-sub">Plateforme de Production Cinématographique IA</div>
    <div class="hero-author">✦ Fondé par KHEDIM BENYAKHLEF dit BENY-JOE ✦</div>
    <div class="hero-tags">
      <span class="tag">🆓 100% Gratuit</span>
      <span class="tag">🤖 Gemini 2.0 Flash</span>
      <span class="tag">🎨 Leonardo AI</span>
      <span class="tag">🎵 Suno AI</span>
      <span class="tag">🎬 Runway ML</span>
      <span class="tag">✂️ DaVinci Resolve</span>
    </div>
    <div id="home-key-alert" style="display:none;background:rgba(224,85,85,.08);border:1px solid rgba(224,85,85,.25);border-radius:8px;padding:.65rem 1rem;font-size:.75rem;color:var(--red);margin:.5rem auto;max-width:480px">
      ⚠️ Clé Gemini non configurée — <a href="#" onclick="show('cfg',nbAt(9))" style="color:var(--gold)">Cliquez ici pour activer l'IA</a>
    </div>
  </div>

  <div class="g4" style="margin-bottom:1.2rem">
    <div class="tc" onclick="show('scen',nbAt(1))"><div class="tc-icon">📝</div><div class="tc-name">Scénario IA</div><div class="tc-desc">Générez scénarios complets, personnages, dialogues.</div><span class="badge badge-blu">GEMINI 2.0</span></div>
    <div class="tc" onclick="show('imp',nbAt(2))"><div class="tc-icon">📚</div><div class="tc-name">Roman → Film</div><div class="tc-desc">Adaptez n'importe quel texte en scénario cinéma.</div><span class="badge badge-grn">GRATUIT</span></div>
    <div class="tc" onclick="show('prod',nbAt(3))"><div class="tc-icon">🎬</div><div class="tc-name">Production IA</div><div class="tc-desc">Plan de production complet par type de projet.</div><span class="badge badge-blu">GEMINI 2.0</span></div>
    <div class="tc" onclick="show('vis',nbAt(4))"><div class="tc-icon">🖼️</div><div class="tc-name">Visuels & Storyboard</div><div class="tc-desc">Prompts SD XL optimisés + storyboard automatique.</div><span class="badge badge-grn">GRATUIT</span></div>
    <div class="tc" onclick="show('mont',nbAt(5))"><div class="tc-icon">✂️</div><div class="tc-name">Montage IA</div><div class="tc-desc">Timeline interactive + conseils de montage pro.</div><span class="badge badge-grn">GRATUIT</span></div>
    <div class="tc" onclick="show('chat',nbAt(6))"><div class="tc-icon">🤖</div><div class="tc-name">Assistant IA</div><div class="tc-desc">Coach cinéma professionnel disponible 24h/24.</div><span class="badge badge-blu">GEMINI 2.0</span></div>
    <div class="tc" onclick="show('export',nbAt(7))"><div class="tc-icon">📦</div><div class="tc-name">Produits Finaux</div><div class="tc-desc">Visualisez et téléchargez tous vos productions.</div><span class="badge badge-gold">NOUVEAU</span></div>
    <div class="tc" onclick="show('outils',nbAt(8))"><div class="tc-icon">🛠️</div><div class="tc-name">Outils IA Gratuits</div><div class="tc-desc">Catalogue complet des meilleurs outils cinéma IA.</div><span class="badge badge-grn">CATALOGUE</span></div>
  </div>

  <div class="card">
    <div class="card-hd">WORKFLOW COMPLET — 8 ÉTAPES</div>
    <div class="step-bar">
      <div class="step-item on">1 · Synopsis</div>
      <div class="step-item">2 · Scénario</div>
      <div class="step-item">3 · Storyboard</div>
      <div class="step-item">4 · Production</div>
      <div class="step-item">5 · Visuels IA</div>
      <div class="step-item">6 · Voix / Son</div>
      <div class="step-item">7 · Montage</div>
      <div class="step-item">8 · Export Final</div>
    </div>
    <p style="font-size:.77rem;color:var(--mu)">Workflow complet de A à Z. Propulsé par <strong style="color:var(--gold)">Google Gemini 2.0 Flash</strong> — le modèle IA le plus rapide et gratuit. 1500 requêtes/jour sans carte bancaire.</p>
  </div>

  <div class="g2">
    <div class="card">
      <div class="card-hd">STATISTIQUES DU PROJET</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.7rem">
        <div style="background:#040a14;border-radius:8px;padding:.8rem;text-align:center"><div style="font-size:1.6rem;font-weight:900;color:var(--gold)" id="stat-scenes">0</div><div style="font-size:.65rem;color:var(--mu)">Scènes</div></div>
        <div style="background:#040a14;border-radius:8px;padding:.8rem;text-align:center"><div style="font-size:1.6rem;font-weight:900;color:var(--blu)" id="stat-exports">0</div><div style="font-size:.65rem;color:var(--mu)">Exports</div></div>
        <div style="background:#040a14;border-radius:8px;padding:.8rem;text-align:center"><div style="font-size:1.6rem;font-weight:900;color:var(--grn)" id="stat-clips">0</div><div style="font-size:.65rem;color:var(--mu)">Clips timeline</div></div>
        <div style="background:#040a14;border-radius:8px;padding:.8rem;text-align:center"><div style="font-size:1.6rem;font-weight:900;color:var(--pur)" id="stat-msgs">0</div><div style="font-size:.65rem;color:var(--mu)">Messages IA</div></div>
      </div>
    </div>
    <div class="card">
      <div class="card-hd">PROJET EN COURS</div>
      <div style="font-size:.82rem;margin-bottom:.45rem">
        <span style="color:var(--mu)">Titre :</span>
        <span id="home-titre" style="color:var(--gold);font-weight:700">—</span>
      </div>
      <div style="font-size:.82rem;margin-bottom:.45rem">
        <span style="color:var(--mu)">Type :</span>
        <span id="home-type" style="color:var(--tx)">—</span>
      </div>
      <div style="font-size:.82rem;margin-bottom:.9rem">
        <span style="color:var(--mu)">Modèle IA :</span>
        <span style="color:var(--grn)">Gemini 2.0 Flash ✓</span>
      </div>
      <button class="btn btn-gold btn-full" onclick="show('scen',nbAt(1))">▶ Commencer le projet</button>
    </div>
  </div>
</div>

<!-- ══════════════════════ SCÉNARIO ══════════════════════ -->
<div id="tab-scen" class="tab">
  <div class="card">
    <div class="card-hd">TYPE DE PRODUCTION</div>
    <div class="pills" id="type-pills">
      <span class="pill on">🎬 Court Métrage</span>
      <span class="pill">🎥 Long Métrage</span>
      <span class="pill">🎵 Clip Musical</span>
      <span class="pill">📹 Documentaire</span>
      <span class="pill">🎨 Dessin Animé</span>
      <span class="pill">📺 Série Web</span>
    </div>
    <div class="g2">
      <div>
        <label>TITRE DU PROJET</label>
        <input id="titre" type="text" placeholder="Ex: La Dernière Lumière d'Oran" oninput="updateHomeStats()">
      </div>
      <div>
        <label>GENRE CINÉMATOGRAPHIQUE</label>
        <select id="genre">
          <option>Drame</option><option>Thriller</option><option>Romance</option>
          <option>Science-Fiction</option><option>Horreur</option><option>Comédie</option>
          <option>Action / Aventure</option><option>Historique</option><option>Fantastique</option>
          <option>Policier</option><option>Biopic</option>
        </select>
      </div>
      <div>
        <label>DURÉE CIBLE</label>
        <select id="duree">
          <option>3 min (Clip)</option>
          <option>15 min (Court métrage)</option>
          <option>30 min (Moyen métrage)</option>
          <option>1h30 (Long métrage)</option>
          <option>2h+ (Épopée cinéma)</option>
        </select>
      </div>
      <div>
        <label>LANGUE DES DIALOGUES</label>
        <select id="langue">
          <option>Français</option>
          <option>Arabe classique (فصحى)</option>
          <option>Darija algérienne (دارجة)</option>
          <option>Anglais</option>
          <option>Bilingue Français/Arabe</option>
        </select>
      </div>
    </div>
  </div>

  <div class="g2">
    <div class="card">
      <div class="card-hd">SYNOPSIS</div>
      <textarea id="synopsis" placeholder="Décrivez votre histoire en quelques phrases — lieu, époque, protagoniste, conflit principal..." style="min-height:170px"></textarea>
      <div style="display:flex;gap:.4rem;margin-top:.65rem;flex-wrap:wrap">
        <button class="btn btn-gold" onclick="genScenario()">✨ Générer scénario complet</button>
        <button class="btn btn-out" onclick="ameliorerSynopsis()">🔧 Améliorer synopsis</button>
      </div>
    </div>
    <div class="card">
      <div class="card-hd">PERSONNAGES</div>
      <div id="perso-list" style="display:flex;flex-direction:column;gap:.42rem;margin-bottom:.65rem;max-height:155px;overflow-y:auto"></div>
      <div style="display:flex;gap:.38rem">
        <input id="new-perso" type="text" placeholder="Nom, rôle, trait dominant..." style="flex:1">
        <button class="btn btn-out" onclick="addPerso()">+ Ajouter</button>
      </div>
      <button class="btn btn-out btn-full" style="margin-top:.48rem" onclick="genPersonnages()">🤖 Générer depuis synopsis</button>
    </div>
  </div>

  <div class="card">
    <div class="card-hd">DÉCOUPAGE EN SCÈNES</div>
    <div style="display:flex;gap:.4rem;margin-bottom:.85rem;flex-wrap:wrap;align-items:center">
      <button class="btn btn-gold" onclick="addScene()">+ Nouvelle scène</button>
      <button class="btn btn-out" onclick="restructurer()">🔄 Restructurer (IA)</button>
      <button class="btn btn-out" onclick="genDialogues()">💬 Générer dialogues</button>
      <button class="btn btn-grn" onclick="exportScript()">💾 Exporter script .txt</button>
      <span id="scene-count" style="margin-left:auto;font-size:.72rem;color:var(--mu)">0 scène(s)</span>
    </div>
    <div id="scene-list"></div>
    <div id="scene-empty" style="text-align:center;padding:1.8rem;color:var(--dim);font-size:.78rem">
      ✦ Cliquez "Générer scénario complet" ou ajoutez des scènes manuellement
    </div>
  </div>
</div>

<!-- ══════════════════════ IMPORT ══════════════════════ -->
<div id="tab-imp" class="tab">
  <div class="card">
    <div class="card-hd">IMPORT — ROMAN / NOUVELLE / ARTICLE</div>
    <p style="font-size:.8rem;color:var(--mu);margin-bottom:1rem">Importez un texte : l'IA analyse la structure, extrait les scènes-clés, les personnages et les dialogues puis génère un scénario adapté.</p>
    <div class="g2">
      <div>
        <div class="dz" onclick="document.getElementById('imp-file').click()">
          <input type="file" id="imp-file" accept=".txt" onchange="loadFile(this)">
          <div style="font-size:2rem;margin-bottom:.5rem">📂</div>
          <div style="font-weight:700">Déposer un fichier .txt</div>
          <div style="font-size:.68rem;color:var(--dim);margin-top:.25rem">Fichier texte — Max 5 MB</div>
        </div>
      </div>
      <div>
        <label>OU COLLEZ LE TEXTE DIRECTEMENT</label>
        <textarea id="imp-text" placeholder="Collez ici votre roman, nouvelle, article, biographie..." style="min-height:130px"></textarea>
      </div>
    </div>
    <div class="g2" style="margin-top:.9rem">
      <div>
        <label>TYPE D'ŒUVRE ORIGINALE</label>
        <select id="imp-type">
          <option>Roman classique</option><option>Roman policier / Thriller</option>
          <option>Romance</option><option>Biographie / Autobiographie</option>
          <option>Nouvelle</option><option>Article journalistique</option>
          <option>Histoire vraie / Fait divers</option>
        </select>
      </div>
      <div>
        <label>ADAPTER EN</label>
        <select id="imp-adapt">
          <option>Court métrage (15 min)</option>
          <option>Long métrage (1h30)</option>
          <option>Clip musical (3 min)</option>
          <option>Mini-série (3 épisodes)</option>
          <option>Documentaire</option>
        </select>
      </div>
    </div>
    <button class="btn btn-gold" style="margin-top:.9rem" onclick="analyserTexte()">🔍 Analyser et adapter avec IA</button>
  </div>
  <div id="imp-result" class="card" style="display:none">
    <div class="card-hd">RÉSULTAT DE L'ADAPTATION</div>
    <div class="out-box" id="imp-out">En attente...</div>
    <div class="out-actions">
      <button class="btn btn-gold" onclick="impVersScenario()">→ Envoyer vers Scénario</button>
      <button class="btn btn-out" onclick="copier('imp-out')">📋 Copier</button>
      <button class="btn btn-grn" onclick="sauvegarderProduit('imp-out','Adaptation','adaptation')">💾 Sauvegarder</button>
    </div>
  </div>
</div>

<!-- ══════════════════════ PRODUCTION ══════════════════════ -->
<div id="tab-prod" class="tab">
  <div class="card">
    <div class="card-hd">TYPE DE PRODUCTION</div>
    <div class="g3">
      <div class="tc sel" id="pt-court" onclick="selProd('court',this)"><div class="tc-icon">🎬</div><div class="tc-name">Court Métrage</div><div class="tc-desc">5 à 30 min · Festivals · Structure 3 actes.</div></div>
      <div class="tc" id="pt-long"  onclick="selProd('long',this)"><div class="tc-icon">🎥</div><div class="tc-name">Long Métrage</div><div class="tc-desc">1h30+ · Arcs narratifs complexes · Cinéma.</div></div>
      <div class="tc" id="pt-clip"  onclick="selProd('clip',this)"><div class="tc-icon">🎵</div><div class="tc-name">Clip Musical</div><div class="tc-desc">3-5 min · Sync musicale · Énergie visuelle.</div></div>
      <div class="tc" id="pt-doc"   onclick="selProd('doc',this)"><div class="tc-icon">📹</div><div class="tc-name">Documentaire</div><div class="tc-desc">Voix off · Interviews · Narration réelle.</div></div>
      <div class="tc" id="pt-anim"  onclick="selProd('anim',this)"><div class="tc-icon">🎨</div><div class="tc-name">Dessin Animé</div><div class="tc-desc">Animation 2D/3D · Prompts SD optimisés.</div></div>
      <div class="tc" id="pt-serie" onclick="selProd('serie',this)"><div class="tc-icon">📺</div><div class="tc-name">Série Web</div><div class="tc-desc">Épisodes 15-45 min · Arcs saisonniers.</div></div>
    </div>
  </div>

  <div class="card">
    <div class="card-hd">PARAMÈTRES CINÉMATOGRAPHIQUES</div>
    <div class="g2">
      <div>
        <label>STYLE VISUEL</label>
        <select id="style">
          <option>Réaliste cinématographique 4K HDR</option>
          <option>Film noir et blanc classique</option>
          <option>Animation Studio Ghibli</option>
          <option>Anime japonais moderne</option>
          <option>Hyperréaliste photo</option>
          <option>Vintage Super 8 / 16mm</option>
          <option>Néonoir futuriste</option>
          <option>Documentaire cinéma-vérité</option>
          <option>Expressionnisme allemand</option>
        </select>
      </div>
      <div>
        <label>FORMAT / RATIO D'IMAGE</label>
        <select id="ratio">
          <option>16:9 — YouTube / Streaming</option>
          <option>2.39:1 — Cinémascope</option>
          <option>1.85:1 — Standard cinéma</option>
          <option>9:16 — TikTok / Reels</option>
          <option>1:1 — Instagram carré</option>
          <option>4:3 — Format classique</option>
        </select>
      </div>
      <div>
        <label>PALETTE DE COULEURS (COLOR GRADING)</label>
        <select id="palette">
          <option>Naturel (aucun filtre)</option>
          <option>Chaud et doré (cinéma romantique)</option>
          <option>Froid et bleuté (thriller polar)</option>
          <option>Désaturé (film dramatique)</option>
          <option>Teal &amp; Orange (blockbuster)</option>
          <option>Sépia vintage (reconstitution historique)</option>
          <option>High contrast noir (expressionniste)</option>
        </select>
      </div>
      <div>
        <label>LANGUE DES DIALOGUES</label>
        <select id="lang-prod">
          <option>Français</option>
          <option>Arabe classique</option>
          <option>Darija algérienne</option>
          <option>Anglais</option>
          <option>Bilingue FR/AR</option>
        </select>
      </div>
    </div>
    <hr class="hr">
    <label>NOTES DE RÉALISATION / CRITÈRES SPÉCIAUX</label>
    <textarea id="criteres" placeholder="Ambiance souhaitée, références de films (ex: style Kubrick), effets spéciaux, public cible, contraintes de budget..."></textarea>
    <div style="display:flex;gap:.42rem;margin-top:.8rem;flex-wrap:wrap">
      <button class="btn btn-gold" onclick="lancerProd()">🎬 Générer le plan de production</button>
      <button class="btn btn-out" onclick="genPromptsProd()">📸 Prompts visuels par scène</button>
      <button class="btn btn-out" onclick="genVoixOff()">🎙️ Générer narration / voix off</button>
      <button class="btn btn-out" onclick="genFiche()">📋 Fiche technique</button>
    </div>
  </div>

  <div id="prod-card" class="card" style="display:none">
    <div class="card-hd" id="prod-card-title">PLAN DE PRODUCTION IA</div>
    <div class="pb-wrap"><div class="pb-fill" id="prod-pb"></div></div>
    <div class="out-box" id="prod-out">Génération en cours...</div>
    <div class="out-actions">
      <button class="btn btn-gold" onclick="show('mont',nbAt(5))">→ Envoyer au Montage</button>
      <button class="btn btn-out" onclick="copier('prod-out')">📋 Copier</button>
      <button class="btn btn-grn" onclick="sauvegarderProduit('prod-out','Plan de production','plan_production')">💾 Sauvegarder</button>
    </div>
  </div>
</div>

<!-- ══════════════════════ VISUELS ══════════════════════ -->
<div id="tab-vis" class="tab">
  <div class="card">
    <div class="card-hd">GÉNÉRATEUR DE PROMPTS VISUELS</div>
    <p style="font-size:.78rem;color:var(--mu);margin-bottom:.9rem">Prompts ultra-optimisés pour Leonardo AI, Bing Image Creator, Stable Diffusion XL — tous 100% gratuits.</p>
    <div class="g2">
      <div>
        <label>DESCRIPTION DE LA SCÈNE</label>
        <textarea id="vis-desc" placeholder="Ex: Plan large d'une médina algérienne au coucher du soleil — ruelles en pierre, lumière dorée, vieilles portes en bois..."style="min-height:105px"></textarea>
        <label style="margin-top:.55rem">STYLE CIBLE</label>
        <select id="vis-style">
          <option>Réaliste photoréaliste (SD XL)</option>
          <option>Film 35mm cinématographique</option>
          <option>Peinture numérique épique</option>
          <option>Concept art professionnel</option>
          <option>Anime / Manga japonais</option>
          <option>Cartoon 3D Pixar style</option>
          <option>Aquarelle artistique</option>
          <option>Photographie vintage argentique</option>
          <option>Dessin au crayon hyperréaliste</option>
        </select>
        <button class="btn btn-gold btn-full" style="margin-top:.65rem" onclick="genPromptVisuel()">✨ Générer prompt optimisé</button>
      </div>
      <div>
        <label>PROMPT GÉNÉRÉ (ANGLAIS + NÉGATIF)</label>
        <div class="out-box" id="vis-out" style="min-height:120px">En attente de génération...</div>
        <div class="out-actions">
          <button class="btn btn-out" onclick="copier('vis-out')">📋 Copier</button>
          <button class="btn btn-out btn-sm" onclick="window.open('https://leonardo.ai','_blank')">→ Leonardo</button>
          <button class="btn btn-out btn-sm" onclick="window.open('https://www.bing.com/images/create','_blank')">→ Bing</button>
          <button class="btn btn-grn btn-sm" onclick="sauvegarderProduit('vis-out','Prompt Visuel','prompt_visuel')">💾</button>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-hd">STORYBOARD AUTOMATIQUE IA</div>
    <p style="font-size:.78rem;color:var(--mu);margin-bottom:.8rem">Génère un prompt image professionnel pour chaque scène de votre scénario. Utilisez ensuite Leonardo AI ou Bing Image Creator.</p>
    <div style="display:flex;gap:.42rem;flex-wrap:wrap;margin-bottom:1rem">
      <button class="btn btn-gold" onclick="genStoryboard()">🎨 Générer storyboard complet</button>
      <button class="btn btn-out" onclick="exportStoryboard()">💾 Exporter storyboard .txt</button>
    </div>
    <div id="sb-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.9rem"></div>
    <div id="sb-empty" style="text-align:center;padding:1.5rem;color:var(--dim);font-size:.78rem">Ajoutez des scènes dans l'onglet Scénario, puis cliquez "Générer storyboard"</div>
  </div>
</div>

<!-- ══════════════════════ MONTAGE ══════════════════════ -->
<div id="tab-mont" class="tab">
  <div class="card">
    <div class="card-hd">TIMELINE — MONTAGE PROFESSIONNEL</div>
    <p style="font-size:.78rem;color:var(--mu);margin-bottom:.9rem">Organisez vos clips. Exportez ensuite vers <strong style="color:var(--gold)">DaVinci Resolve</strong> (100% gratuit) pour le montage final.</p>

    <div style="margin-bottom:.75rem">
      <div class="tl-lbl">▶ PISTE VIDÉO</div>
      <div class="tl-track" id="tl-video"><span style="color:var(--dim);font-size:.72rem;padding:.3rem">Aucun clip — cliquez "+ Clip vidéo"</span></div>
    </div>
    <div style="margin-bottom:.75rem">
      <div class="tl-lbl">🎵 PISTE AUDIO</div>
      <div class="tl-track" id="tl-audio"><span style="color:var(--dim);font-size:.72rem;padding:.3rem">Aucune piste — cliquez "+ Musique"</span></div>
    </div>
    <div style="margin-bottom:.75rem">
      <div class="tl-lbl">🎙️ PISTE VOIX OFF</div>
      <div class="tl-track" id="tl-vo"><span style="color:var(--dim);font-size:.72rem;padding:.3rem">Aucune voix — cliquez "+ Voix Off"</span></div>
    </div>

    <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.8rem">
      <button class="btn btn-gold" onclick="addClip()">+ Clip vidéo</button>
      <button class="btn btn-out" onclick="addMusic()">+ Musique</button>
      <button class="btn btn-out" onclick="addVO()">+ Voix Off</button>
      <button class="btn btn-out" onclick="clearTimeline()">🗑️ Vider timeline</button>
      <button class="btn btn-grn" onclick="genMontage()">🤖 Conseils de montage IA</button>
      <span id="clip-count" style="margin-left:auto;font-size:.72rem;color:var(--mu)"></span>
    </div>
  </div>

  <div class="card">
    <div class="card-hd">RECOMMANDATIONS DE MONTAGE IA</div>
    <div class="out-box" id="mont-out">Cliquez "Conseils de montage IA" pour recevoir des recommandations personnalisées basées sur votre projet.</div>
    <div class="out-actions">
      <button class="btn btn-out" onclick="copier('mont-out')">📋 Copier</button>
      <button class="btn btn-grn" onclick="sauvegarderProduit('mont-out','Plan de montage','plan_montage')">💾 Sauvegarder</button>
      <button class="btn btn-out" onclick="window.open('https://www.blackmagicdesign.com/fr/products/davinciresolve','_blank')">→ DaVinci Resolve (gratuit)</button>
    </div>
  </div>
</div>

<!-- ══════════════════════ CHAT ══════════════════════ -->
<div id="tab-chat" class="tab">
  <div class="card">
    <div class="card-hd">🤖 BENY-JOE CINIE IA — ASSISTANT PERSONNEL</div>
    <div style="margin-bottom:.75rem">
      <label>MODE DE DISCUSSION</label>
      <div class="pills" id="mode-pills">
        <span class="pill on">💬 Conversation libre</span>
        <span class="pill">📝 Scénario & Écriture</span>
        <span class="pill">🎥 Réalisation technique</span>
        <span class="pill">💰 Production & Budget</span>
        <span class="pill">✂️ Montage & Post-prod</span>
        <span class="pill">🏆 Festivals & Distribution</span>
        <span class="pill">📱 Réseaux sociaux</span>
      </div>
    </div>
    <div class="chat-wrap" id="chat-box">
      <div class="msg msg-ai">
        <div class="msg-name">🎬 BENY-JOE CINIE IA — Gemini 2.0 Flash</div>
        Bonjour ! Je suis votre assistant cinéma professionnel, propulsé par Google Gemini 2.0 Flash. Fondé par KHEDIM BENYAKHLEF dit BENY-JOE.<br><br>Comment puis-je vous aider dans votre production ? Scénario, réalisation, montage, distribution — je suis là pour vous.
      </div>
    </div>
    <div class="chat-input-row">
      <input type="text" id="chat-in" placeholder="Posez votre question cinéma...">
      <button class="btn btn-gold" onclick="sendMsg()">Envoyer ↗</button>
      <button class="btn btn-out" onclick="clearChat()">🗑️</button>
    </div>
    <div style="margin-top:.65rem;display:flex;gap:.3rem;flex-wrap:wrap">
      <button class="btn btn-out btn-sm" onclick="qp('Comment améliorer la structure de mon scénario ?')">Structure scénario</button>
      <button class="btn btn-out btn-sm" onclick="qp('Quels angles de caméra pour une scène de tension ?')">Angles caméra</button>
      <button class="btn btn-out btn-sm" onclick="qp('Comment financer un court métrage avec 0 budget ?')">Financement</button>
      <button class="btn btn-out btn-sm" onclick="qp('Les meilleurs festivals de cinéma indépendant en Algérie et France ?')">Festivals</button>
      <button class="btn btn-out btn-sm" onclick="qp('Comment faire un casting professionnel sans budget ?')">Casting</button>
      <button class="btn btn-out btn-sm" onclick="qp('Conseils pour le color grading avec DaVinci Resolve gratuit ?')">Color grading</button>
    </div>
  </div>
</div>

<!-- ══════════════════════ PRODUITS FINAUX ══════════════════════ -->
<div id="tab-export" class="tab">
  <div class="card">
    <div class="card-hd">📦 VOS PRODUCTIONS — VISUALISATION & TÉLÉCHARGEMENT</div>
    <p style="font-size:.78rem;color:var(--mu);margin-bottom:1rem">Tous vos contenus générés avec l'IA. Visualisez, téléchargez, supprimez. Les fichiers sont sauvegardés sur le serveur.</p>
    <div style="display:flex;gap:.42rem;flex-wrap:wrap;margin-bottom:1rem">
      <button class="btn btn-gold" onclick="chargerExports()">🔄 Rafraîchir</button>
      <button class="btn btn-out" onclick="exporterTout()">📥 Tout télécharger (.zip)</button>
      <button class="btn btn-red" onclick="supprimerTout()">🗑️ Tout supprimer</button>
    </div>
    <div id="export-grid" class="g3">
      <div class="product-empty" id="export-empty">
        <div class="product-empty-icon">📂</div>
        <div class="product-empty-txt">Aucun produit sauvegardé.<br>Générez du contenu et cliquez "💾 Sauvegarder".</div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-hd">📄 FICHIERS EXPORTÉS SUR LE SERVEUR</div>
    <div id="export-files-list">
      <div style="text-align:center;padding:1.5rem;color:var(--dim);font-size:.78rem">Aucun fichier exporté.</div>
    </div>
  </div>
</div>

<!-- ══════════════════════ OUTILS ══════════════════════ -->
<div id="tab-outils" class="tab">
  <div class="card">
    <div class="card-hd">📸 IMAGES IA — GRATUIT</div>
    <div class="g3">
      <div class="tc" onclick="window.open('https://leonardo.ai','_blank')"><div class="tc-icon">🎨</div><div class="tc-name">Leonardo AI</div><div class="tc-desc">150 générations/jour. Qualité cinéma professionnelle.</div><span class="badge badge-grn">150/JOUR GRATUIT</span></div>
      <div class="tc" onclick="window.open('https://www.bing.com/images/create','_blank')"><div class="tc-icon">🖼️</div><div class="tc-name">Bing Image Creator</div><div class="tc-desc">DALL-E 3 intégré. Illimité et gratuit.</div><span class="badge badge-grn">ILLIMITÉ GRATUIT</span></div>
      <div class="tc" onclick="window.open('https://ideogram.ai','_blank')"><div class="tc-icon">💡</div><div class="tc-name">Ideogram AI</div><div class="tc-desc">Excellent pour texte dans les images.</div><span class="badge badge-grn">GRATUIT</span></div>
    </div>
  </div>
  <div class="card">
    <div class="card-hd">🎬 VIDÉO IA</div>
    <div class="g3">
      <div class="tc" onclick="window.open('https://runwayml.com','_blank')"><div class="tc-icon">🎥</div><div class="tc-name">Runway ML</div><div class="tc-desc">125 crédits/mois. Génération vidéo Gen-3.</div><span class="badge badge-grn">125 CRÉDITS/MOIS</span></div>
      <div class="tc" onclick="window.open('https://klingai.com','_blank')"><div class="tc-icon">🎞️</div><div class="tc-name">Kling AI</div><div class="tc-desc">Vidéos 10 sec cinématographiques de haute qualité.</div><span class="badge badge-grn">PLAN GRATUIT</span></div>
      <div class="tc" onclick="window.open('https://pika.art','_blank')"><div class="tc-icon">⚡</div><div class="tc-name">Pika Labs</div><div class="tc-desc">Animations et effets spéciaux IA.</div><span class="badge badge-grn">PLAN GRATUIT</span></div>
    </div>
  </div>
  <div class="card">
    <div class="card-hd">🎵 MUSIQUE & SON IA</div>
    <div class="g3">
      <div class="tc" onclick="window.open('https://suno.ai','_blank')"><div class="tc-icon">🎵</div><div class="tc-name">Suno AI</div><div class="tc-desc">50 chansons originales/jour. Toutes ambiances.</div><span class="badge badge-grn">50/JOUR GRATUIT</span></div>
      <div class="tc" onclick="window.open('https://udio.com','_blank')"><div class="tc-icon">🎹</div><div class="tc-name">Udio</div><div class="tc-desc">Musique IA haute qualité, toute durée.</div><span class="badge badge-grn">PLAN GRATUIT</span></div>
      <div class="tc" onclick="window.open('https://elevenlabs.io','_blank')"><div class="tc-icon">🎙️</div><div class="tc-name">ElevenLabs</div><div class="tc-desc">Voix off ultra-réaliste. 10 000 car./mois gratuit.</div><span class="badge badge-grn">10K/MOIS GRATUIT</span></div>
    </div>
  </div>
  <div class="card">
    <div class="card-hd">✂️ MONTAGE VIDÉO — 100% GRATUIT</div>
    <div class="g3">
      <div class="tc" onclick="window.open('https://www.blackmagicdesign.com/fr/products/davinciresolve','_blank')"><div class="tc-icon">🎞️</div><div class="tc-name">DaVinci Resolve</div><div class="tc-desc">Montage professionnel Hollywood. 100% gratuit.</div><span class="badge badge-grn">100% GRATUIT</span></div>
      <div class="tc" onclick="window.open('https://kdenlive.org/fr/','_blank')"><div class="tc-icon">✂️</div><div class="tc-name">Kdenlive</div><div class="tc-desc">Open source professionnel. Linux/Mac/Windows.</div><span class="badge badge-grn">OPEN SOURCE</span></div>
      <div class="tc" onclick="window.open('https://www.openshot.org/fr/','_blank')"><div class="tc-icon">🎬</div><div class="tc-name">OpenShot</div><div class="tc-desc">Interface simple. Idéal pour débuter.</div><span class="badge badge-grn">GRATUIT</span></div>
    </div>
  </div>
  <div class="card">
    <div class="card-hd">✍️ SCÉNARIO & ÉCRITURE</div>
    <div class="g3">
      <div class="tc" onclick="window.open('https://trelby.org','_blank')"><div class="tc-icon">📝</div><div class="tc-name">Trelby</div><div class="tc-desc">Logiciel scénario professionnel gratuit.</div><span class="badge badge-grn">GRATUIT</span></div>
      <div class="tc" onclick="window.open('https://www.celtx.com','_blank')"><div class="tc-icon">📄</div><div class="tc-name">Celtx</div><div class="tc-desc">Formatage professionnel Hollywood en ligne.</div><span class="badge badge-grn">GRATUIT DE BASE</span></div>
      <div class="tc" onclick="window.open('https://fountain.io','_blank')"><div class="tc-icon">⛲</div><div class="tc-name">Fountain</div><div class="tc-desc">Format texte simple pour scénarios.</div><span class="badge badge-grn">OPEN SOURCE</span></div>
    </div>
  </div>
</div>

<!-- ══════════════════════ CONFIG ══════════════════════ -->
<div id="tab-cfg" class="tab">
  <div class="card">
    <div class="card-hd">INFORMATIONS DU STUDIO</div>
    <div style="font-size:.82rem;line-height:2">
      <div>🎬 <strong style="color:var(--gold)">BENY-JOE CINIE IA v4 Ultimate</strong> — Studio de Production Cinématographique</div>
      <div>✦ <strong>Fondé par</strong> KHEDIM BENYAKHLEF dit BENY-JOE</div>
      <div>🤖 Propulsé par <strong style="color:var(--grn)">Google Gemini 2.0 Flash</strong> — Le modèle IA le plus récent</div>
      <div>🔒 Clé API stockée <strong>uniquement côté serveur</strong> — jamais exposée au navigateur</div>
      <div>💾 Exports sauvegardés dans <strong>_data/exports/</strong> sur le serveur</div>
      <div style="margin-top:.5rem" id="key-status">⏳ Vérification de la clé API...</div>
    </div>
  </div>

  <div class="card">
    <div class="card-hd">🔑 CLÉ API GOOGLE GEMINI 2.0</div>
    <div style="font-size:.78rem;color:var(--mu);margin-bottom:.9rem">
      Obtenez votre clé <strong style="color:var(--gold)">GRATUITE</strong> sur :
      <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--gold)">aistudio.google.com/app/apikey</a><br>
      Plan gratuit : <strong>1500 requêtes/jour</strong> avec Gemini 2.0 Flash — aucune carte bancaire requise.<br>
      La clé commence par <code style="color:var(--gold)">AIza...</code> et est stockée uniquement côté serveur.
    </div>
    <div style="display:flex;gap:.42rem;align-items:flex-end">
      <div style="flex:1"><label>ENTREZ VOTRE CLÉ GEMINI API</label><input type="password" id="key-in" placeholder="AIza..."></div>
      <button class="btn btn-gold" onclick="saveKey()">🔒 Sauvegarder</button>
    </div>
    <div style="margin-top:.65rem;display:grid;grid-template-columns:1fr 1fr;gap:.5rem;font-size:.72rem">
      <div style="padding:.55rem;background:rgba(61,184,128,.07);border:1px solid rgba(61,184,128,.2);border-radius:7px;color:var(--grn)">✅ 1500 requêtes / jour</div>
      <div style="padding:.55rem;background:rgba(61,184,128,.07);border:1px solid rgba(61,184,128,.2);border-radius:7px;color:var(--grn)">✅ Gemini 2.0 Flash</div>
      <div style="padding:.55rem;background:rgba(61,184,128,.07);border:1px solid rgba(61,184,128,.2);border-radius:7px;color:var(--grn)">✅ 8192 tokens / réponse</div>
      <div style="padding:.55rem;background:rgba(61,184,128,.07);border:1px solid rgba(61,184,128,.2);border-radius:7px;color:var(--grn)">✅ Aucun paiement requis</div>
    </div>
  </div>

  <div class="card">
    <div class="card-hd">PRÉFÉRENCES</div>
    <div class="srow"><div class="slabel">Notifications IA<div class="sdesc">Afficher les alertes à chaque génération</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
    <div class="srow"><div class="slabel">Sauvegarde auto<div class="sdesc">Sauvegarder le script toutes les 10 min</div></div><div class="toggle" onclick="this.classList.toggle('on')"></div></div>
    <div class="srow" style="border:none"><div class="slabel">Mode haute qualité<div class="sdesc">Utiliser 8192 tokens (réponses plus longues)</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
  </div>

  <div class="card">
    <div class="card-hd">DANGER</div>
    <p style="font-size:.78rem;color:var(--mu);margin-bottom:.75rem">Supprimer toutes les données du projet (scènes, historique, exports locaux). Cette action est irréversible.</p>
    <button class="btn btn-red" onclick="resetProjet()">⚠️ Réinitialiser le projet</button>
  </div>
</div>

</div><!-- /main -->

<footer>🎬 <strong>BENY-JOE CINIE IA v4 Ultimate</strong> &nbsp;·&nbsp; Fondé par <span style="color:var(--gold)">KHEDIM BENYAKHLEF dit BENY-JOE</span> &nbsp;·&nbsp; Propulsé par <span style="color:var(--grn)">Google Gemini 2.0 Flash</span></footer>
<div id="notif"></div>

<!-- ══════════════════════ MODAL VISIONNEUSE ══════════════════════ -->
<div class="modal-bg" id="modal-bg" onclick="fermerModal(event)">
  <div class="modal" id="modal">
    <div class="modal-hd">
      <span id="modal-title">Aperçu</span>
      <button class="modal-close" onclick="fermerModal()">✕</button>
    </div>
    <div class="modal-body" id="modal-body"></div>
    <div style="display:flex;gap:.42rem;margin-top:1rem;flex-wrap:wrap">
      <button class="btn btn-gold" onclick="telechargerModal()">💾 Télécharger</button>
      <button class="btn btn-out" onclick="copierModal()">📋 Copier</button>
      <button class="btn btn-out" onclick="fermerModal()">Fermer</button>
    </div>
  </div>
</div>

<script>
/* ══════════════════ ÉTAT GLOBAL ══════════════════ */
var scenes    = [];
var chatHist  = [];
var prodType  = 'court';
var produits  = [];   // produits sauvegardés localement (session)
var clipCount = 0;

/* ══════════════════ NAVIGATION ══════════════════ */
function nbAt(i){ return document.querySelectorAll('#nav .nb')[i]; }

function show(name, btn){
  document.querySelectorAll('.tab').forEach(function(t){ t.classList.remove('on'); });
  var el = document.getElementById('tab-'+name);
  if(el) el.classList.add('on');
  document.querySelectorAll('#nav .nb').forEach(function(b){ b.classList.remove('on'); });
  if(btn) btn.classList.add('on');
  if(name === 'export') chargerExports();
  if(name === 'home') updateHomeStats();
}

/* ══════════════════ NOTIFS ══════════════════ */
function notif(msg, type){
  var el = document.getElementById('notif');
  el.textContent = msg;
  el.className = 'show ' + (type === 'err' ? 'err' : 'ok');
  clearTimeout(el._t);
  el._t = setTimeout(function(){ el.classList.remove('show'); }, 3600);
}

/* ══════════════════ PILLS ══════════════════ */
function initPills(){
  document.querySelectorAll('.pills').forEach(function(c){
    c.querySelectorAll('.pill').forEach(function(p){
      p.addEventListener('click', function(){
        c.querySelectorAll('.pill').forEach(function(x){ x.classList.remove('on'); });
        p.classList.add('on');
      });
    });
  });
}

/* ══════════════════ STATS ACCUEIL ══════════════════ */
function updateHomeStats(){
  var t = document.getElementById('titre');
  if(t && t.value){
    document.getElementById('home-titre').textContent = t.value;
    var tp = document.querySelector('#type-pills .pill.on');
    document.getElementById('home-type').textContent = tp ? tp.textContent : '—';
  }
  document.getElementById('stat-scenes').textContent = scenes.length;
  document.getElementById('stat-exports').textContent = produits.length;
  document.getElementById('stat-clips').textContent = clipCount;
  document.getElementById('stat-msgs').textContent = chatHist.length;
}

/* ══════════════════ CLÉ API ══════════════════ */
function checkKey(){
  fetch('/api/key-status')
    .then(function(r){ return r.json(); })
    .then(function(d){
      var el    = document.getElementById('key-status');
      var badge = document.getElementById('ai-status-badge');
      var alert = document.getElementById('home-key-alert');
      if(d.configured){
        if(el){ el.innerHTML = '✅ Clé Gemini 2.0 configurée — <strong>IA opérationnelle</strong>'; el.style.color = 'var(--grn)'; }
        if(badge){ badge.textContent = 'GEMINI 2.0 ✓'; badge.className = 'ok'; }
        if(alert) alert.style.display = 'none';
      } else {
        if(el){ el.innerHTML = '⚠️ Aucune clé API — <a href="#" onclick="show(\'cfg\',nbAt(9))" style="color:var(--gold)">Configurer maintenant</a>'; el.style.color = 'var(--red)'; }
        if(badge){ badge.textContent = 'IA INACTIF'; badge.className = ''; }
        if(alert) alert.style.display = '';
      }
    }).catch(function(){});
}

function saveKey(){
  var k = document.getElementById('key-in').value.trim();
  if(!k){ notif('Entrez une clé Gemini API (AIza...)', 'err'); return; }
  if(k.length < 20){ notif('Clé invalide — vérifiez qu\'elle commence par AIza...', 'err'); return; }
  fetch('/api/set-key', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({key:k})
  })
  .then(function(r){ return r.json(); })
  .then(function(d){
    if(d.error){ notif('Erreur : '+d.error, 'err'); }
    else { notif('✅ Clé Gemini 2.0 sécurisée sur le serveur !'); document.getElementById('key-in').value=''; checkKey(); }
  })
  .catch(function(){ notif('Erreur réseau', 'err'); });
}

/* ══════════════════ APPEL GEMINI 2.0 ══════════════════ */
function gemini(prompt, sys, cb){
  var btn = event && event.target;
  if(btn && btn.classList) btn.disabled = true;
  fetch('/api/gemini', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      messages: [{role:'user', content: prompt}],
      system: sys || 'Tu es un scénariste et réalisateur professionnel de cinéma. Réponds en français avec précision, créativité et style cinématographique professionnel.'
    })
  })
  .then(function(r){ return r.json(); })
  .then(function(d){
    if(btn && btn.classList) btn.disabled = false;
    if(d.error){ notif('Erreur IA : '+d.error, 'err'); cb(null); }
    else cb(d.text);
  })
  .catch(function(e){ if(btn && btn.classList) btn.disabled = false; notif('Erreur réseau : '+e.message, 'err'); cb(null); });
}

/* ══════════════════ SCÉNARIO ══════════════════ */
function addPerso(){
  var v = document.getElementById('new-perso').value.trim();
  if(!v){ notif('Entrez un personnage', 'err'); return; }
  var d = document.createElement('div');
  d.style.cssText = 'display:flex;align-items:center;gap:.42rem;padding:.35rem .65rem;background:#07111e;border-radius:7px;border:1px solid var(--dim);font-size:.78rem';
  d.innerHTML = '<span style="color:var(--gold)">👤</span><span style="flex:1">'+esc(v)+'</span><button onclick="this.parentNode.remove()" style="background:none;border:none;color:var(--mu);cursor:pointer;font-size:.9rem;padding:0">✕</button>';
  document.getElementById('perso-list').appendChild(d);
  document.getElementById('new-perso').value = '';
}

function getPersonnages(){
  return Array.from(document.querySelectorAll('#perso-list span[style*="flex:1"]')).map(function(s){ return s.textContent; });
}

function addScene(titre, type, desc){
  var sc = {id:Date.now(), num:scenes.length+1, titre:titre||'', type:type||'INT.', desc:desc||''};
  scenes.push(sc);
  renderScenes();
  document.getElementById('scene-empty').style.display = 'none';
  updateHomeStats();
}

function renderScenes(){
  var c = document.getElementById('scene-list'); c.innerHTML = '';
  document.getElementById('scene-count').textContent = scenes.length + ' scène(s)';
  scenes.forEach(function(sc, i){
    var d = document.createElement('div');
    d.className = 'scene-item';
    d.innerHTML =
      '<div class="scene-num">'+sc.num+'</div>'+
      '<div class="scene-body">'+
        '<div class="scene-row">'+
          '<input data-i="'+i+'" data-f="titre" value="'+escA(sc.titre)+'" placeholder="Titre de la scène..." style="flex:1;font-size:.79rem;font-weight:700">'+
          '<select data-i="'+i+'" data-f="type" style="width:100px;font-size:.75rem">'+
            ['INT.','EXT.','INT./EXT.','EXT./INT.'].map(function(t){ return '<option'+(sc.type===t?' selected':'')+'>'+t+'</option>'; }).join('')+
          '</select>'+
          '<button class="btn btn-out btn-sm" onclick="genSceneIA('+i+')">🤖 IA</button>'+
          '<button class="btn btn-red btn-sm" onclick="supprimerScene('+i+')">✕</button>'+
        '</div>'+
        '<textarea data-i="'+i+'" data-f="desc" placeholder="Description, décor, action, dialogues..." style="min-height:75px;font-size:.77rem">'+escA(sc.desc)+'</textarea>'+
      '</div>';
    d.querySelectorAll('input,select,textarea').forEach(function(el){
      el.addEventListener('input', function(){
        var idx = +this.getAttribute('data-i');
        var field = this.getAttribute('data-f');
        if(scenes[idx]) scenes[idx][field] = this.value;
      });
    });
    c.appendChild(d);
  });
  updateHomeStats();
}

function supprimerScene(i){
  scenes.splice(i,1);
  scenes.forEach(function(s,idx){ s.num=idx+1; });
  renderScenes();
  if(scenes.length===0) document.getElementById('scene-empty').style.display='';
}

function genScenario(){
  var titre  = document.getElementById('titre').value || 'Sans titre';
  var genre  = document.getElementById('genre').value;
  var duree  = document.getElementById('duree').value;
  var langue = document.getElementById('langue').value;
  var type   = (document.querySelector('#type-pills .pill.on')||{}).textContent || 'Court Métrage';
  var syn    = document.getElementById('synopsis').value;
  if(!syn){ notif('Écrivez votre synopsis d\'abord', 'err'); return; }
  notif('🤖 Génération du scénario complet par Gemini 2.0...');
  var p = 'Génère un SCÉNARIO DE FILM PROFESSIONNEL complet au format scène par scène.\n\nTITRE: '+titre+'\nTYPE: '+type+'\nGENRE: '+genre+'\nDURÉE: '+duree+'\nLANGUE DIALOGUES: '+langue+'\nSYNOPSIS: '+syn+'\n\nFormat pour chaque scène:\nSCÈNE N — TITRE\n[INT./EXT.] LIEU — MOMENT\nDescription action...\nDIALOGUES:\nPERSONNAGE: texte\n---\n\nCrée au minimum 5 scènes avec dialogues, descriptions atmosphériques détaillées.';
  gemini(p, 'Tu es un scénariste professionnel primé. Génère des scénarios de qualité festival.', function(r){
    if(!r) return;
    scenes = [];
    var blocs = r.split(/SCÈNE\s+\d+\s*[—-]/i).filter(function(b){ return b.trim(); });
    if(blocs.length < 2) blocs = r.split(/---+/).filter(function(b){ return b.trim(); });
    blocs.forEach(function(b, idx){
      var lines = b.trim().split('\n');
      var titre = lines[0] ? lines[0].replace(/^\s*[\[\(].*?[\]\)]/, '').trim() : 'Scène '+(idx+1);
      var rest  = lines.slice(1).join('\n').trim();
      var type  = 'INT.';
      var match = rest.match(/\b(INT\.|EXT\.|INT\.\/EXT\.|EXT\.\/INT\.)\b/);
      if(match){ type = match[1]; rest = rest.replace(match[0], '').trim(); }
      scenes.push({id:Date.now()+idx, num:idx+1, titre:titre.substring(0,80), type:type, desc:rest.substring(0,1000)});
    });
    if(scenes.length===0){ addScene('Scénario complet','INT.',r.substring(0,800)); }
    else renderScenes();
    document.getElementById('scene-empty').style.display = 'none';
    notif('✅ '+scenes.length+' scènes générées avec Gemini 2.0 !');
  });
}

function ameliorerSynopsis(){
  var s = document.getElementById('synopsis').value.trim();
  if(!s){ notif('Écrivez votre synopsis','err'); return; }
  notif('🤖 Amélioration en cours...');
  gemini('Améliore ce synopsis de film pour le rendre plus accrocheur, cinématographique et percutant. Conserve l\'essence mais rend-le plus dramatique et visuel:\n\n'+s, null, function(r){
    if(r){ document.getElementById('synopsis').value=r; notif('✅ Synopsis amélioré !'); }
  });
}

function genPersonnages(){
  var s = document.getElementById('synopsis').value.trim();
  if(!s){ notif('Écrivez votre synopsis','err'); return; }
  notif('🤖 Génération des personnages...');
  gemini('Depuis ce synopsis, crée 4-6 personnages cinématographiques.\nFormat STRICT: Nom | Âge | Rôle | Trait dominant | Arc narratif\n\nSYNOPSIS: '+s, null, function(r){
    if(!r) return;
    var c = document.getElementById('perso-list'); c.innerHTML='';
    r.split('\n').filter(function(l){ return l.includes('|'); }).forEach(function(l){
      var d = document.createElement('div');
      d.style.cssText='display:flex;align-items:center;gap:.42rem;padding:.35rem .65rem;background:#07111e;border-radius:7px;border:1px solid var(--dim);font-size:.75rem';
      d.innerHTML='<span style="color:var(--gold)">👤</span><span style="flex:1">'+esc(l.trim())+'</span><button onclick="this.parentNode.remove()" style="background:none;border:none;color:var(--mu);cursor:pointer">✕</button>';
      c.appendChild(d);
    });
    notif('✅ Personnages générés !');
  });
}

function genSceneIA(i){
  notif('🤖 Génération de la scène '+scenes[i].num+'...');
  var persos = getPersonnages().join(', ') || 'non définis';
  gemini('Écris cette scène de film de façon professionnelle avec dialogues et mise en scène:\nSCÈNE: '+scenes[i].titre+'\nTYPE: '+scenes[i].type+'\nCONTEXTE: '+(scenes[i].desc||'vide')+'\nPERSONNAGES DU FILM: '+persos+'\n\nInclure: description atmosphérique, action détaillée, dialogues réalistes.', null, function(r){
    if(r){ scenes[i].desc=r; renderScenes(); notif('✅ Scène '+scenes[i].num+' rédigée !'); }
  });
}

function genDialogues(){
  if(scenes.length===0){ notif('Ajoutez des scènes d\'abord','err'); return; }
  notif('🤖 Génération des dialogues...');
  var synopsis = document.getElementById('synopsis').value||'';
  var txt = scenes.map(function(s){ return 'Scène '+s.num+': '+s.titre+' — '+(s.desc||'').substring(0,100); }).join('\n');
  gemini('Génère des dialogues cinématographiques professionnels pour ces scènes:\n\nSYNOPSIS: '+synopsis.substring(0,300)+'\n\nSCÈNES:\n'+txt+'\n\nFormat: SCÈNE N\nPERSONNAGE A:\n(texte)\nPERSONNAGE B:\n(texte)', null, function(r){
    if(r){
      document.getElementById('prod-card').style.display='';
      document.getElementById('prod-card-title').textContent = 'DIALOGUES GÉNÉRÉS';
      document.getElementById('prod-out').textContent=r;
      show('prod',nbAt(3));
      notif('✅ Dialogues générés !');
    }
  });
}

function restructurer(){
  if(scenes.length<2){ notif('Ajoutez au moins 2 scènes','err'); return; }
  notif('🔄 Analyse structurale en cours...');
  var txt = scenes.map(function(s){ return s.num+'. '+s.titre+' — '+(s.desc||'').substring(0,100); }).join('\n');
  gemini('Analyse la structure narrative de ces scènes. Propose un réordonnancement optimal pour maximiser l\'impact dramatique. Explique pourquoi chaque déplacement améliore le récit:\n\n'+txt, null, function(r){
    if(r){
      document.getElementById('prod-card').style.display='';
      document.getElementById('prod-card-title').textContent = 'ANALYSE STRUCTURALE IA';
      document.getElementById('prod-out').textContent=r;
      show('prod',nbAt(3));
      notif('✅ Analyse disponible dans Production');
    }
  });
}

function exportScript(){
  if(scenes.length===0){ notif('Aucune scène à exporter','err'); return; }
  var titre = document.getElementById('titre').value || 'Scénario';
  var type  = (document.querySelector('#type-pills .pill.on')||{}).textContent||'';
  var persos = getPersonnages();
  var txt = '╔══════════════════════════════════════╗\n║      BENY-JOE CINIE IA — v4          ║\n║  Fondé par KHEDIM BENYAKHLEF         ║\n╚══════════════════════════════════════╝\n\n';
  txt += titre.toUpperCase()+'\n';
  txt += type+'\n';
  txt += 'Date : '+new Date().toLocaleDateString('fr-FR')+'\n';
  if(persos.length) txt += '\nPERSONNAGES:\n'+persos.map(function(p){ return '  · '+p; }).join('\n')+'\n';
  txt += '\n'+'═'.repeat(50)+'\n\n';
  scenes.forEach(function(s){
    txt += 'SCÈNE '+s.num+' — '+s.titre.toUpperCase()+'\n';
    txt += s.type+'\n\n';
    txt += (s.desc||'')+'\n\n';
    txt += '─'.repeat(40)+'\n\n';
  });
  dl(txt, (titre||'scenario').replace(/\s+/g,'_')+'_script.txt');
  sauvegarderFichier(txt, (titre||'scenario').replace(/\s+/g,'_')+'_script.txt');
  notif('✅ Script exporté et sauvegardé !');
}

/* ══════════════════ IMPORT ══════════════════ */
function loadFile(input){
  var file = input.files[0]; if(!file) return;
  if(file.size > 5*1024*1024){ notif('Fichier trop grand (max 5 MB)','err'); return; }
  var reader = new FileReader();
  reader.onload = function(e){ document.getElementById('imp-text').value=e.target.result.substring(0,12000); notif('📂 Fichier chargé ('+Math.round(file.size/1024)+' KB)'); };
  reader.onerror = function(){ notif('Erreur de lecture du fichier','err'); };
  reader.readAsText(file,'UTF-8');
}

function analyserTexte(){
  var text = document.getElementById('imp-text').value.trim();
  if(text.length < 50){ notif('Texte trop court — minimum 50 caractères','err'); return; }
  notif('🔍 Analyse et adaptation en cours (Gemini 2.0)...');
  gemini(
    'Analyse ce texte et crée une ADAPTATION CINÉMATOGRAPHIQUE PROFESSIONNELLE complète.\n\nTYPE ORIGINAL: '+document.getElementById('imp-type').value+'\nADAPTER EN: '+document.getElementById('imp-adapt').value+'\n\nTEXTE ORIGINAL (extrait):\n'+text.substring(0,4000)+'\n\nLivre:\n1. RÉSUMÉ (200 mots)\n2. PERSONNAGES PRINCIPAUX\n3. DÉCOUPAGE EN SCÈNES (5 scènes minimum)\n4. NOTES DE RÉALISATION\n5. AMBIANCE VISUELLE RECOMMANDÉE',
    'Tu es un adaptateur cinéma professionnel spécialisé. Crée des adaptations de haute qualité.',
    function(r){
      if(r){
        document.getElementById('imp-result').style.display='';
        document.getElementById('imp-out').textContent=r;
        notif('✅ Adaptation terminée !');
      }
    }
  );
}

function impVersScenario(){
  var text = document.getElementById('imp-out').textContent;
  if(!text){ notif('Rien à transférer','err'); return; }
  document.getElementById('synopsis').value = text.substring(0,1200);
  show('scen',nbAt(1));
  notif('✅ Envoyé vers Scénario !');
}

/* ══════════════════ PRODUCTION ══════════════════ */
function selProd(type, el){
  prodType = type;
  document.querySelectorAll('[id^="pt-"]').forEach(function(c){ c.classList.remove('sel'); });
  if(el) el.classList.add('sel');
}

function lancerProd(){
  var style   = document.getElementById('style').value;
  var ratio   = document.getElementById('ratio').value;
  var palette = document.getElementById('palette').value;
  var langue  = document.getElementById('lang-prod').value;
  var crit    = document.getElementById('criteres').value;
  var syn     = document.getElementById('synopsis').value||'';
  var titre   = document.getElementById('titre').value||'Non défini';
  document.getElementById('prod-card').style.display='';
  document.getElementById('prod-card-title').textContent='PLAN DE PRODUCTION IA';
  document.getElementById('prod-pb').style.width='15%';
  document.getElementById('prod-out').textContent='⏳ Génération par Gemini 2.0 Flash...';
  var p = 'CRÉE UN PLAN DE PRODUCTION CINÉMATOGRAPHIQUE ULTRA-PROFESSIONNEL:\n\nPROJET: '+titre+'\nTYPE: '+prodType.toUpperCase()+'\nSTYLE VISUEL: '+style+'\nRATIO: '+ratio+'\nCOLOR GRADING: '+palette+'\nLANGUE: '+langue+'\nSCÈNES: '+scenes.length+'\nSYNOPSIS: '+syn.substring(0,300)+'\nCRITÈRES: '+(crit||'Standard')+'\n\nInclure:\n1. PRÉ-PRODUCTION (casting, repérages, équipement)\n2. TOURNAGE (planning journalier, équipe technique)\n3. POST-PRODUCTION (montage, color grading, son)\n4. OUTILS IA GRATUITS recommandés pour chaque étape\n5. PLANNING 4 SEMAINES (tableau)\n6. BUDGET ZÉRO (solutions gratuites uniquement)';
  document.getElementById('prod-pb').style.width='55%';
  gemini(p, 'Tu es un producteur de cinéma professionnel avec 20 ans d\'expérience. Crée des plans de production détaillés et réalistes.', function(r){
    document.getElementById('prod-pb').style.width='100%';
    if(r){ document.getElementById('prod-out').textContent=r; notif('✅ Plan de production généré par Gemini 2.0 !'); }
  });
}

function genPromptsProd(){
  if(scenes.length===0){ notif('Ajoutez des scènes d\'abord','err'); return; }
  notif('🤖 Génération des prompts visuels...');
  var txt = scenes.slice(0,10).map(function(s){ return s.num+'. '+s.titre+': '+(s.desc||'').substring(0,150); }).join('\n');
  var style = document.getElementById('style').value;
  gemini('Génère des prompts Stable Diffusion XL ultra-optimisés, un par scène:\n\nSTYLE GLOBAL: '+style+'\n\nSCÈNES:\n'+txt+'\n\nFormat pour chaque: SCÈNE N — TITRE:\n[POSITIVE PROMPT en anglais, très détaillé]\n[NEGATIVE PROMPT]', null, function(r){
    if(r){
      document.getElementById('prod-card').style.display='';
      document.getElementById('prod-card-title').textContent='PROMPTS VISUELS PAR SCÈNE';
      document.getElementById('prod-out').textContent=r;
      notif('✅ '+scenes.length+' prompts générés !');
    }
  });
}

function genVoixOff(){
  var syn = document.getElementById('synopsis').value||'';
  if(!syn){ notif('Écrivez votre synopsis d\'abord','err'); return; }
  notif('🤖 Génération de la narration...');
  gemini('Écris une NARRATION VOIX OFF cinématographique professionnelle pour ce projet:\n\nSYNOPSIS: '+syn+'\nTYPE: '+prodType+'\nSTYLE: '+document.getElementById('style').value+'\n\nCrée:\n1. Narration d\'ouverture (30 sec)\n2. Narrations des scènes principales\n3. Narration de clôture\n4. Texte pour ElevenLabs (prêt à coller)', null, function(r){
    if(r){
      document.getElementById('prod-card').style.display='';
      document.getElementById('prod-card-title').textContent='NARRATION / VOIX OFF';
      document.getElementById('prod-out').textContent=r;
      notif('✅ Narration générée !');
    }
  });
}

function genFiche(){
  var titre = document.getElementById('titre').value||'Non défini';
  var syn   = document.getElementById('synopsis').value||'';
  notif('🤖 Génération de la fiche technique...');
  gemini('Crée une FICHE TECHNIQUE CINÉMATOGRAPHIQUE PROFESSIONNELLE complète pour:\n\nTITRE: '+titre+'\nTYPE: '+prodType+'\nSTYLE: '+document.getElementById('style').value+'\nRATIO: '+document.getElementById('ratio').value+'\nSYNOPSIS: '+syn.substring(0,200)+'\n\nInclure: format de tournage, équipement caméra recommandé, éclairage, son, outils de montage, étalonage, distribution, festivals cibles.', null, function(r){
    if(r){
      document.getElementById('prod-card').style.display='';
      document.getElementById('prod-card-title').textContent='FICHE TECHNIQUE';
      document.getElementById('prod-out').textContent=r;
      notif('✅ Fiche technique générée !');
    }
  });
}

/* ══════════════════ VISUELS ══════════════════ */
function genPromptVisuel(){
  var desc = document.getElementById('vis-desc').value.trim();
  if(!desc){ notif('Décrivez votre scène','err'); return; }
  notif('🤖 Génération du prompt optimisé...');
  gemini('Génère un prompt image ULTRA-OPTIMISÉ pour Stable Diffusion XL / Leonardo AI.\n\nDESCRIPTION: '+desc+'\nSTYLE: '+document.getElementById('vis-style').value+'\n\nFormat:\n✅ POSITIVE PROMPT (anglais, très détaillé — composition, éclairage, caméra, qualité, style):\n[prompt]\n\n❌ NEGATIVE PROMPT:\n[prompt négatif]\n\n💡 VARIATIONS SUGGÉRÉES:\n[3 variations]', null, function(r){
    if(r){
      document.getElementById('vis-out').textContent=r;
      notif('✅ Prompt optimisé généré !');
    }
  });
}

function genStoryboard(){
  if(scenes.length===0){ notif('Ajoutez des scènes d\'abord','err'); return; }
  var c = document.getElementById('sb-grid'); c.innerHTML='';
  document.getElementById('sb-empty').style.display='none';
  notif('🤖 Génération du storyboard complet...');
  var txt = scenes.map(function(s){ return s.num+'. '+s.titre+' ('+s.type+'): '+(s.desc||'').substring(0,120); }).join('\n');
  var style = document.getElementById('vis-style').value;
  gemini('Génère un prompt Stable Diffusion XL pour chaque scène du storyboard.\n\nSTYLE GLOBAL: '+style+'\nSCÈNES:\n'+txt+'\n\nFormat STRICT pour chaque ligne:\nSCÈNE N|prompt_anglais_détaillé\n\nUn seul pipe (|) par ligne. Pas de guillemets.', null, function(r){
    if(!r){ document.getElementById('sb-empty').style.display=''; return; }
    var lines = r.split('\n').filter(function(l){ return l.includes('|'); });
    if(lines.length===0){ document.getElementById('sb-empty').style.display=''; notif('Erreur de format','err'); return; }
    lines.forEach(function(line, idx){
      var parts = line.split('|');
      var label  = (parts[0]||'SCÈNE '+(idx+1)).trim();
      var prompt = (parts[1]||'').trim();
      var d = document.createElement('div'); d.className='sb-card';
      d.innerHTML=
        '<div class="sb-num">'+esc(label)+'</div>'+
        '<div class="sb-prompt" id="sbp-'+idx+'">'+esc(prompt)+'</div>'+
        '<div style="display:flex;gap:.32rem;flex-wrap:wrap">'+
          '<button class="btn btn-out btn-sm" onclick="copyEl(this.previousElementSibling.previousElementSibling)">📋 Copier</button>'+
          '<button class="btn btn-out btn-sm" onclick="window.open(\'https://leonardo.ai\',\'_blank\')">→ Leonardo</button>'+
          '<button class="btn btn-out btn-sm" onclick="window.open(\'https://www.bing.com/images/create\',\'_blank\')">→ Bing</button>'+
        '</div>';
      c.appendChild(d);
    });
    notif('✅ Storyboard généré — '+lines.length+' planches !');
  });
}

function exportStoryboard(){
  if(scenes.length===0){ notif('Aucune scène','err'); return; }
  var items = document.querySelectorAll('.sb-prompt');
  if(items.length===0){ notif('Générez d\'abord le storyboard','err'); return; }
  var titre = document.getElementById('titre').value||'storyboard';
  var txt = 'BENY-JOE CINIE IA — STORYBOARD\nFondé par KHEDIM BENYAKHLEF dit BENY-JOE\n\nTITRE: '+titre+'\n\n'+'═'.repeat(50)+'\n\n';
  items.forEach(function(el, i){ txt += 'PLANCHE '+(i+1)+':\n'+el.textContent+'\n\nOutil: https://leonardo.ai\n\n'+'─'.repeat(40)+'\n\n'; });
  dl(txt, titre.replace(/\s+/g,'_')+'_storyboard.txt');
  sauvegarderFichier(txt, titre.replace(/\s+/g,'_')+'_storyboard.txt');
  notif('✅ Storyboard exporté !');
}

/* ══════════════════ MONTAGE ══════════════════ */
function addClip(){
  var nom = prompt('Nom du clip vidéo:'); if(!nom) return;
  var dur = prompt('Durée (ex: 00:45):') || '';
  var c = document.createElement('div'); c.className='clip';
  c.innerHTML='<span>'+esc(nom)+'</span><span style="font-size:.58rem;color:var(--mu)">'+(dur||'VIDEO')+'</span><button class="clip-del" onclick="this.parentNode.remove();clipCount--;updateHomeStats()">✕</button>';
  var wrap = document.getElementById('tl-video');
  var empty = wrap.querySelector('span[style*="color:var(--dim)"]');
  if(empty) empty.remove();
  wrap.appendChild(c);
  clipCount++; updateHomeStats();
}

function addMusic(){
  var nom = prompt('Titre de la musique / son:'); if(!nom) return;
  var c = document.createElement('div'); c.className='clip clip-audio';
  c.innerHTML='<span>'+esc(nom)+'</span><span style="font-size:.58rem;color:var(--mu)">AUDIO</span><button class="clip-del" onclick="this.parentNode.remove();clipCount--;updateHomeStats()" style="color:rgba(74,158,255,.7)">✕</button>';
  var wrap = document.getElementById('tl-audio');
  var empty = wrap.querySelector('span[style*="color:var(--dim)"]');
  if(empty) empty.remove();
  wrap.appendChild(c);
  clipCount++; updateHomeStats();
}

function addVO(){
  var nom = prompt('Description voix off:'); if(!nom) return;
  var c = document.createElement('div');
  c.style.cssText='background:rgba(155,127,232,.15);border:1px solid rgba(155,127,232,.3);border-radius:4px;height:40px;min-width:80px;padding:.22rem .45rem;font-size:.62rem;color:var(--pur);cursor:pointer;display:flex;flex-direction:column;justify-content:space-between;position:relative';
  c.innerHTML='<span>'+esc(nom)+'</span><span style="font-size:.58rem;color:var(--mu)">VOIX</span><button class="clip-del" onclick="this.parentNode.remove();clipCount--;updateHomeStats()">✕</button>';
  var wrap = document.getElementById('tl-vo');
  var empty = wrap.querySelector('span[style*="color:var(--dim)"]');
  if(empty) empty.remove();
  wrap.appendChild(c);
  clipCount++; updateHomeStats();
  document.getElementById('clip-count').textContent = clipCount + ' élément(s) dans la timeline';
}

function clearTimeline(){
  if(!confirm('Vider toute la timeline ?')) return;
  ['tl-video','tl-audio','tl-vo'].forEach(function(id){
    var w = document.getElementById(id); w.innerHTML='';
    var label = id==='tl-video'?'Aucun clip — cliquez "+ Clip vidéo"':id==='tl-audio'?'Aucune piste — cliquez "+ Musique"':'Aucune voix — cliquez "+ Voix Off"';
    w.innerHTML='<span style="color:var(--dim);font-size:.72rem;padding:.3rem">'+label+'</span>';
  });
  clipCount=0; updateHomeStats(); notif('🗑️ Timeline vidée');
}

function genMontage(){
  notif('🤖 Analyse du montage par Gemini 2.0...');
  var syn   = document.getElementById('synopsis')? document.getElementById('synopsis').value:'';
  var titre = document.getElementById('titre')? document.getElementById('titre').value:'';
  var clips = Array.from(document.querySelectorAll('#tl-video .clip span:first-child')).map(function(s){ return s.textContent; });
  gemini(
    'Donne des RECOMMANDATIONS DE MONTAGE PROFESSIONNEL ultra-détaillées:\n\nPROJET: '+(titre||'Non défini')+'\nTYPE: '+prodType+'\nNB SCÈNES: '+scenes.length+'\nCLIPS TIMELINE: '+(clips.length?clips.join(', '):'non définis')+'\nSYNOPSIS: '+(syn.substring(0,300)||'Non défini')+'\n\nConseils sur:\n1. Rythme et durée des plans\n2. Types de transitions recommandées\n3. Structure narrative du montage\n4. Traitement sonore et musical\n5. Color grading avec DaVinci Resolve\n6. Logiciels gratuits et tutoriels\n7. Export final (format, codec, plateforme)',
    'Tu es un monteur cinéma primé à Cannes. Donne des conseils professionnels concrets.',
    function(r){
      if(r){ document.getElementById('mont-out').textContent=r; notif('✅ Recommandations générées !'); }
    }
  );
}

/* ══════════════════ CHAT ══════════════════ */
function sendMsg(){
  var inp = document.getElementById('chat-in');
  var msg = inp.value.trim(); if(!msg) return;
  inp.value='';
  var box = document.getElementById('chat-box');
  box.innerHTML += '<div class="msg msg-user"><div class="msg-name">VOUS</div>'+esc(msg)+'</div>';
  var ld = document.createElement('div'); ld.className='msg msg-ai';
  ld.innerHTML='<div class="msg-name">🎬 BENY-JOE CINIE IA</div><span class="ld"></span>';
  box.appendChild(ld); box.scrollTop=box.scrollHeight;
  chatHist.push({role:'user',content:msg});
  var mode = (document.querySelector('#mode-pills .pill.on')||{}).textContent||'Libre';
  var syn  = document.getElementById('synopsis')? document.getElementById('synopsis').value:'';
  var titre= document.getElementById('titre')? document.getElementById('titre').value:'';
  fetch('/api/gemini',{
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({
      messages: chatHist.slice(-12),
      system: 'Tu es BENY-JOE CINIE IA, assistant cinéma professionnel fondé par KHEDIM BENYAKHLEF dit BENY-JOE. Propulsé par Gemini 2.0 Flash. Mode: '+mode+(titre?'. Projet en cours: '+titre:'')+(syn?'. Synopsis: '+syn.substring(0,150):'')+'. Réponds en français, de façon professionnelle, précise et créative. Tu peux utiliser des emojis cinéma avec modération.'
    })
  })
  .then(function(r){ return r.json(); })
  .then(function(d){
    ld.remove();
    if(d.text){
      chatHist.push({role:'assistant',content:d.text});
      box.innerHTML+='<div class="msg msg-ai"><div class="msg-name">🎬 BENY-JOE CINIE IA — Gemini 2.0</div>'+d.text.replace(/\n/g,'<br>')+'</div>';
      updateHomeStats();
    } else notif('Erreur IA : '+(d.error||'inconnue'),'err');
    box.scrollTop=box.scrollHeight;
  })
  .catch(function(){ ld.remove(); notif('Erreur réseau','err'); });
}

function qp(p){ document.getElementById('chat-in').value=p; sendMsg(); }

function clearChat(){
  chatHist=[];
  document.getElementById('chat-box').innerHTML='<div class="msg msg-ai"><div class="msg-name">🎬 BENY-JOE CINIE IA</div>Chat réinitialisé. Comment puis-je vous aider ?</div>';
  updateHomeStats();
}

/* ══════════════════ PRODUITS FINAUX ══════════════════ */
function sauvegarderProduit(srcId, nom, type){
  var el = document.getElementById(srcId);
  if(!el||!el.textContent.trim()){ notif('Rien à sauvegarder','err'); return; }
  var content = el.textContent.trim();
  var titre   = (document.getElementById('titre')? document.getElementById('titre').value : '') || 'Projet';
  var prod = {
    id: Date.now(), nom: nom, type: type, titre: titre,
    content: content, date: new Date().toLocaleString('fr-FR'),
    size: content.length
  };
  produits.push(prod);
  // Sauvegarder sur le serveur
  sauvegarderFichier(content, type+'_'+Date.now()+'.txt');
  notif('✅ "'+nom+'" sauvegardé dans Produits Finaux !');
  updateHomeStats();
}

function sauvegarderFichier(content, filename){
  fetch('/api/save-export', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({content:content, filename:filename})
  }).catch(function(){});
}

function chargerExports(){
  // Afficher les produits locaux
  var grid = document.getElementById('export-grid');
  grid.innerHTML='';
  if(produits.length===0){
    grid.innerHTML='<div class="product-empty" id="export-empty"><div class="product-empty-icon">📂</div><div class="product-empty-txt">Aucun produit sauvegardé.<br>Générez du contenu et cliquez "💾 Sauvegarder".</div></div>';
  } else {
    produits.forEach(function(p, i){
      var icons = {adaptation:'📚',plan_production:'🎬',plan_montage:'✂️',prompt_visuel:'🖼️',Adaptation:'📚',default:'📄'};
      var icon  = icons[p.type]||icons.default;
      var d = document.createElement('div'); d.className='product-card';
      d.innerHTML=
        '<div class="product-type" style="color:var(--gold)">'+icon+' '+p.type.toUpperCase()+'</div>'+
        '<div class="product-title">'+esc(p.nom)+'</div>'+
        '<div class="product-meta">📁 '+esc(p.titre)+' · 📅 '+p.date+' · '+Math.round(p.size/1000)+' KB</div>'+
        '<div class="product-preview">'+esc(p.content.substring(0,300))+'...</div>'+
        '<div class="product-actions">'+
          '<button class="btn btn-gold btn-sm" onclick="voirProduit('+i+')">👁️ Voir</button>'+
          '<button class="btn btn-grn btn-sm" onclick="dlProduit('+i+')">💾 Télécharger</button>'+
          '<button class="btn btn-out btn-sm" onclick="copierProduit('+i+')">📋 Copier</button>'+
          '<button class="btn btn-red btn-sm" onclick="supprimerProduit('+i+')">🗑️</button>'+
        '</div>';
      grid.appendChild(d);
    });
  }
  // Charger les fichiers serveur
  fetch('/api/list-exports')
    .then(function(r){ return r.json(); })
    .then(function(d){
      var list = document.getElementById('export-files-list');
      if(!d.files||d.files.length===0){
        list.innerHTML='<div style="text-align:center;padding:1.5rem;color:var(--dim);font-size:.78rem">Aucun fichier exporté sur le serveur.</div>';
        return;
      }
      list.innerHTML='';
      d.files.forEach(function(f){
        var row = document.createElement('div'); row.className='export-row';
        var ext = f.name.split('.').pop();
        var ic  = ext==='txt'?'📄':ext==='pdf'?'📕':'📁';
        var size= f.size>1024?Math.round(f.size/1024)+' KB':f.size+' B';
        var date= new Date(f.date).toLocaleString('fr-FR');
        row.innerHTML=
          '<div class="export-icon">'+ic+'</div>'+
          '<div class="export-info"><div class="export-name">'+esc(f.name)+'</div><div class="export-meta">'+size+' · '+date+'</div></div>'+
          '<div class="export-acts">'+
            '<button class="btn btn-gold btn-sm" onclick="dlServeur(\''+encodeURIComponent(f.name)+'\')">💾 Télécharger</button>'+
            '<button class="btn btn-red btn-sm" onclick="supprServeur(\''+encodeURIComponent(f.name)+'\',this.closest(\'.export-row\'))">🗑️</button>'+
          '</div>';
        list.appendChild(row);
      });
    }).catch(function(){});
}

function voirProduit(i){
  var p = produits[i]; if(!p) return;
  document.getElementById('modal-title').textContent = p.nom+' — '+p.titre;
  document.getElementById('modal-body').textContent = p.content;
  document.getElementById('modal-bg').classList.add('open');
  window._modalContent = p.content;
  window._modalFilename = p.type+'_'+p.titre.replace(/\s+/g,'_')+'.txt';
}

function dlProduit(i){
  var p = produits[i]; if(!p) return;
  dl(p.content, p.type+'_'+p.titre.replace(/\s+/g,'_')+'.txt');
  notif('✅ Téléchargement de "'+p.nom+'"...');
}

function copierProduit(i){
  var p = produits[i]; if(!p) return;
  navigator.clipboard.writeText(p.content).then(function(){ notif('📋 Copié dans le presse-papier !'); }).catch(function(){ notif('Copie impossible','err'); });
}

function supprimerProduit(i){
  if(!confirm('Supprimer ce produit ?')) return;
  produits.splice(i,1);
  chargerExports();
  updateHomeStats();
  notif('🗑️ Produit supprimé');
}

function exporterTout(){
  if(produits.length===0){ notif('Aucun produit à exporter','err'); return; }
  var tout = produits.map(function(p){
    return '═══════════════════════════\n'+p.nom.toUpperCase()+' — '+p.titre+'\n'+p.date+'\n═══════════════════════════\n\n'+p.content+'\n\n';
  }).join('\n');
  dl(tout, 'beny_joe_cinie_exports_'+Date.now()+'.txt');
  notif('✅ Tous les produits téléchargés !');
}

function supprimerTout(){
  if(!confirm('Supprimer TOUS les produits ? Cette action est irréversible.')) return;
  produits=[];
  chargerExports();
  updateHomeStats();
  notif('🗑️ Tous les produits supprimés');
}

function dlServeur(filename){
  window.open('/api/download-export?file='+filename,'_blank');
}

function supprServeur(filename, row){
  if(!confirm('Supprimer ce fichier du serveur ?')) return;
  fetch('/api/delete-export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:decodeURIComponent(filename)})})
  .then(function(r){ return r.json(); })
  .then(function(d){ if(d.success){ row.remove(); notif('🗑️ Fichier supprimé'); } else notif('Erreur','err'); })
  .catch(function(){ notif('Erreur réseau','err'); });
}

/* ══════════════════ MODAL ══════════════════ */
function fermerModal(e){
  if(!e||e.target===document.getElementById('modal-bg')||e.type!=='click'||e.target.closest('.modal')){
    if(e && e.target.closest('.modal') && e.target!==document.getElementById('modal-bg')) return;
    document.getElementById('modal-bg').classList.remove('open');
  }
  if(!e) document.getElementById('modal-bg').classList.remove('open');
}
function telechargerModal(){ if(window._modalContent) dl(window._modalContent, window._modalFilename||'export.txt'); }
function copierModal(){ if(window._modalContent) navigator.clipboard.writeText(window._modalContent).then(function(){ notif('📋 Copié !'); }); }

/* ══════════════════ UTILITAIRES ══════════════════ */
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escA(s){ return esc(s).replace(/'/g,'&#39;'); }

function copier(id){
  var el=document.getElementById(id); if(!el) return;
  navigator.clipboard.writeText(el.textContent).then(function(){ notif('📋 Copié !'); }).catch(function(){ notif('Copie impossible','err'); });
}

function copyEl(el){
  navigator.clipboard.writeText(el.textContent).then(function(){ notif('📋 Copié !'); }).catch(function(){ notif('Copie impossible','err'); });
}

function dl(content, filename){
  var blob = new Blob([content],{type:'text/plain;charset=utf-8'});
  var a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename;
  document.body.appendChild(a); a.click();
  setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 1000);
}

function resetProjet(){
  if(!confirm('Réinitialiser TOUT le projet ? (scènes, historique, exports locaux)')) return;
  scenes=[]; chatHist=[]; produits=[]; clipCount=0;
  document.getElementById('titre').value='';
  document.getElementById('synopsis').value='';
  document.getElementById('perso-list').innerHTML='';
  document.getElementById('scene-list').innerHTML='';
  document.getElementById('scene-empty').style.display='';
  document.getElementById('scene-count').textContent='0 scène(s)';
  ['tl-video','tl-audio','tl-vo'].forEach(function(id){ document.getElementById(id).innerHTML=''; });
  updateHomeStats();
  notif('✅ Projet réinitialisé');
}

/* ══════════════════ INIT ══════════════════ */
window.addEventListener('load', function(){
  initPills();
  checkKey();
  document.getElementById('chat-in').addEventListener('keydown', function(e){
    if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMsg(); }
  });
  // Keyboard nav
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape') fermerModal();
  });
  updateHomeStats();
  // Step bar animation
  document.querySelectorAll('.step-item').forEach(function(s,i){
    s.addEventListener('click', function(){
      document.querySelectorAll('.step-item').forEach(function(x){ x.classList.remove('on'); });
      s.classList.add('on');
    });
  });
});
</script>
</body>
</html>`;

// ─── SERVEUR HTTP ─────────────────────────────────────────────────────────────
const server = http.createServer(async function(req, res) {
  const u = new URL(req.url, 'http://x');
  const p = u.pathname;
  const m = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (m === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  function json(d, code) {
    res.writeHead(code || 200, {'Content-Type': 'application/json; charset=utf-8'});
    res.end(JSON.stringify(d));
  }

  // ── GET /api/key-status ──────────────────────────────────────────────────────
  if (p === '/api/key-status' && m === 'GET') {
    return json({ configured: !!getKey() });
  }

  // ── POST /api/set-key ────────────────────────────────────────────────────────
  if (p === '/api/set-key' && m === 'POST') {
    const b = await readBody(req);
    if (!b.key || b.key.length < 15) {
      return json({ error: 'Clé invalide — elle doit commencer par AIza...' }, 400);
    }
    setKey(b.key);
    return json({ success: true });
  }

  // ── POST /api/gemini ─────────────────────────────────────────────────────────
  if (p === '/api/gemini' && m === 'POST') {
    const apiKey = getKey();
    if (!apiKey) {
      return json({ error: 'Clé API Gemini non configurée. Allez dans ⚙️ Config.' }, 503);
    }
    const b = await readBody(req);
    if (!b.messages || !Array.isArray(b.messages) || b.messages.length === 0) {
      return json({ error: 'Paramètre messages manquant ou vide' }, 400);
    }
    try {
      const result = await callGemini(apiKey, b.messages, b.system || null);
      if (result.error) {
        const msg = result.error.message || JSON.stringify(result.error);
        return json({ error: msg }, 502);
      }
      var text = '';
      if (result.candidates && result.candidates[0]) {
        const cand = result.candidates[0];
        if (cand.content && cand.content.parts) {
          text = cand.content.parts.map(function(part){ return part.text || ''; }).join('');
        }
        if (cand.finishReason === 'SAFETY') {
          return json({ error: 'Réponse bloquée par les filtres de sécurité Gemini.' }, 400);
        }
      }
      if (!text) return json({ error: 'Aucune réponse de Gemini — vérifiez votre clé API.' }, 502);
      return json({ text: text });
    } catch(e) {
      return json({ error: 'Erreur API : ' + e.message }, 502);
    }
  }

  // ── POST /api/save-export ────────────────────────────────────────────────────
  if (p === '/api/save-export' && m === 'POST') {
    const b = await readBody(req);
    if (!b.content || !b.filename) return json({ error: 'content et filename requis' }, 400);
    try {
      const safeName = b.filename.replace(/[^a-zA-Z0-9_\-.]/g, '_').substring(0, 100);
      const file = saveExport(safeName, b.content);
      return json({ success: true, file: file });
    } catch(e) {
      return json({ error: e.message }, 500);
    }
  }

  // ── GET /api/list-exports ────────────────────────────────────────────────────
  if (p === '/api/list-exports' && m === 'GET') {
    return json({ files: listExports() });
  }

  // ── GET /api/download-export ─────────────────────────────────────────────────
  if (p === '/api/download-export' && m === 'GET') {
    const filename = u.searchParams.get('file');
    if (!filename) return json({ error: 'Paramètre file manquant' }, 400);
    const safe = path.basename(filename).replace(/[^a-zA-Z0-9_\-.]/g, '_');
    const full = path.join(EXPORTS_DIR, safe);
    if (!fs.existsSync(full)) return json({ error: 'Fichier introuvable' }, 404);
    const content = fs.readFileSync(full, 'utf8');
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'attachment; filename="' + safe + '"'
    });
    return res.end(content);
  }

  // ── POST /api/delete-export ──────────────────────────────────────────────────
  if (p === '/api/delete-export' && m === 'POST') {
    const b = await readBody(req);
    if (!b.filename) return json({ error: 'filename requis' }, 400);
    const safe = path.basename(b.filename).replace(/[^a-zA-Z0-9_\-.]/g, '_');
    const full = path.join(EXPORTS_DIR, safe);
    try {
      if (fs.existsSync(full)) fs.unlinkSync(full);
      return json({ success: true });
    } catch(e) {
      return json({ error: e.message }, 500);
    }
  }

  // ── Toutes autres routes → page HTML ────────────────────────────────────────
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(PAGE);
});

server.listen(PORT, function() {
  console.log('');
  console.log('  ╔════════════════════════════════════════════════════════╗');
  console.log('  ║        🎬  BENY-JOE CINIE IA — STUDIO ULTIME v4       ║');
  console.log('  ║     Fondé par KHEDIM BENYAKHLEF dit BENY-JOE           ║');
  console.log('  ╠════════════════════════════════════════════════════════╣');
  console.log('  ║  URL     : http://localhost:' + PORT + '                       ║');
  console.log('  ║  IA      : Google Gemini 2.0 Flash (1500 req/jour)     ║');
  console.log('  ║  Exports : _data/exports/ (téléchargement depuis app)  ║');
  console.log('  ║  Auth    : Clé via GEMINI_API_KEY ou Config ⚙️           ║');
  console.log('  ╚════════════════════════════════════════════════════════╝');
  console.log('');
});
