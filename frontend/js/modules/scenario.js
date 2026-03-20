// ═══════════════════════════════════════
// MODULE SCÉNARIO — Génération IA
// BENY-JOE CINIE IA v5
// ═══════════════════════════════════════
'use strict';


function genScenario(){
  var titre  = document.getElementById('titre').value || 'Sans titre';
  var genre  = document.getElementById('genre').value;
  var duree  = document.getElementById('duree').value;
  var langue = document.getElementById('langue').value;
  var type   = (document.querySelector('#type-pills .pill.on')||{}).textContent || 'Court Métrage';
  var syn    = document.getElementById('synopsis').value;
  if(!syn){ notif('Écrivez votre synopsis d\'abord', 'err'); return; }
  notif('🤖 Génération du scénario complet par Groq Llama 3.3...');
  var p = 'Génère un SCÉNARIO DE FILM PROFESSIONNEL complet au format scène par scène.\n\nTITRE: '+titre+'\nTYPE: '+type+'\nGENRE: '+genre+'\nDURÉE: '+duree+'\nLANGUE DIALOGUES: '+langue+'\nSYNOPSIS: '+syn+'\n\nFormat pour chaque scène:\nSCÈNE N — TITRE\n[INT./EXT.] LIEU — MOMENT\nDescription action...\nDIALOGUES:\nPERSONNAGE: texte\n---\n\nCrée au minimum 5 scènes avec dialogues, descriptions atmosphériques détaillées.';
  groq(p, 'Tu es un scénariste professionnel primé. Génère des scénarios de qualité festival.', function(r){
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
    notif('✅ '+scenes.length+' scènes générées avec Groq Llama 3.3 !');
  });
}

function ameliorerSynopsis(){
  var s = document.getElementById('synopsis').value.trim();
  if(!s){ notif('Écrivez votre synopsis','err'); return; }
  notif('🤖 Amélioration en cours...');
  groq('Améliore ce synopsis de film pour le rendre plus accrocheur, cinématographique et percutant. Conserve l\'essence mais rend-le plus dramatique et visuel:\n\n'+s, null, function(r){
    if(r){ document.getElementById('synopsis').value=r; notif('✅ Synopsis amélioré !'); }
  });
}

function genPersonnages(){
  var s = document.getElementById('synopsis').value.trim();
  if(!s){ notif('Écrivez votre synopsis','err'); return; }
  notif('🤖 Génération des personnages...');
  groq('Depuis ce synopsis, crée 4-6 personnages cinématographiques.\nFormat STRICT: Nom | Âge | Rôle | Trait dominant | Arc narratif\n\nSYNOPSIS: '+s, null, function(r){
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
  groq('Écris cette scène de film de façon professionnelle avec dialogues et mise en scène:\nSCÈNE: '+scenes[i].titre+'\nTYPE: '+scenes[i].type+'\nCONTEXTE: '+(scenes[i].desc||'vide')+'\nPERSONNAGES DU FILM: '+persos+'\n\nInclure: description atmosphérique, action détaillée, dialogues réalistes.', null, function(r){
    if(r){ scenes[i].desc=r; renderScenes(); notif('✅ Scène '+scenes[i].num+' rédigée !'); }
  });
}

function genDialogues(){
  if(scenes.length===0){ notif('Ajoutez des scènes d\'abord','err'); return; }
  notif('🤖 Génération des dialogues...');
  var synopsis = document.getElementById('synopsis').value||'';
  var txt = scenes.map(function(s){ return 'Scène '+s.num+': '+s.titre+' — '+(s.desc||'').substring(0,100); }).join('\n');
  groq('Génère des dialogues cinématographiques professionnels pour ces scènes:\n\nSYNOPSIS: '+synopsis.substring(0,300)+'\n\nSCÈNES:\n'+txt+'\n\nFormat: SCÈNE N\nPERSONNAGE A:\n(texte)\nPERSONNAGE B:\n(texte)', null, function(r){
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
  groq('Analyse la structure narrative de ces scènes. Propose un réordonnancement optimal pour maximiser l\'impact dramatique. Explique pourquoi chaque déplacement améliore le récit:\n\n'+txt, null, function(r){
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
        if(el){ el.innerHTML = '✅ Clé Groq Llama 3.3 configurée — <strong>IA opérationnelle</strong>'; el.style.color = 'var(--grn)'; }
        if(badge){ badge.textContent = '⚡ GROQ AI ✓'; badge.className = 'ok'; }
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
  if(!k){ notif('Entrez une clé Groq API (AIza...)', 'err'); return; }
  if(k.length < 20){ notif('Clé invalide — vérifiez qu\'elle commence par AIza...', 'err'); return; }
  fetch('/api/set-key', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({key:k})
  })
  .then(function(r){ return r.json(); })
  .then(function(d){
    if(d.error){ notif('Erreur : '+d.error, 'err'); }
    else { notif('✅ Clé Groq Llama 3.3 sécurisée sur le serveur !'); document.getElementById('key-in').value=''; checkKey(); }
  })
  .catch(function(){ notif('Erreur réseau', 'err'); });
}

/* ══════════════════ APPEL GROQ AI ══════════════════ */
function groq(prompt, sys, cb){
  var btn = event && event.target;
  if(btn && btn.classList) btn.disabled = true;
  fetch('/api/groq', {
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
