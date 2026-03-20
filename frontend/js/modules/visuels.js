// ═══════════════════════════════════════
// MODULE VISUELS — Storyboard & Prompts SD
// BENY-JOE CINIE IA v5
// ═══════════════════════════════════════
'use strict';


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
  notif('🔍 Analyse et adaptation en cours (Groq Llama 3.3)...');
  groq(
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
  document.getElementById('prod-out').textContent='⏳ Génération par Groq Llama 3.3 70B...';
  var p = 'CRÉE UN PLAN DE PRODUCTION CINÉMATOGRAPHIQUE ULTRA-PROFESSIONNEL:\n\nPROJET: '+titre+'\nTYPE: '+prodType.toUpperCase()+'\nSTYLE VISUEL: '+style+'\nRATIO: '+ratio+'\nCOLOR GRADING: '+palette+'\nLANGUE: '+langue+'\nSCÈNES: '+scenes.length+'\nSYNOPSIS: '+syn.substring(0,300)+'\nCRITÈRES: '+(crit||'Standard')+'\n\nInclure:\n1. PRÉ-PRODUCTION (casting, repérages, équipement)\n2. TOURNAGE (planning journalier, équipe technique)\n3. POST-PRODUCTION (montage, color grading, son)\n4. OUTILS IA GRATUITS recommandés pour chaque étape\n5. PLANNING 4 SEMAINES (tableau)\n6. BUDGET ZÉRO (solutions gratuites uniquement)';
  document.getElementById('prod-pb').style.width='55%';
  groq(p, 'Tu es un producteur de cinéma professionnel avec 20 ans d\'expérience. Crée des plans de production détaillés et réalistes.', function(r){
    document.getElementById('prod-pb').style.width='100%';
    if(r){ document.getElementById('prod-out').textContent=r; notif('✅ Plan de production généré par Groq Llama 3.3 !'); }
  });
}

function genPromptsProd(){
  if(scenes.length===0){ notif('Ajoutez des scènes d\'abord','err'); return; }
  notif('🤖 Génération des prompts visuels...');
  var txt = scenes.slice(0,10).map(function(s){ return s.num+'. '+s.titre+': '+(s.desc||'').substring(0,150); }).join('\n');
  var style = document.getElementById('style').value;
  groq('Génère des prompts Stable Diffusion XL ultra-optimisés, un par scène:\n\nSTYLE GLOBAL: '+style+'\n\nSCÈNES:\n'+txt+'\n\nFormat pour chaque: SCÈNE N — TITRE:\n[POSITIVE PROMPT en anglais, très détaillé]\n[NEGATIVE PROMPT]', null, function(r){
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
  groq('Écris une NARRATION VOIX OFF cinématographique professionnelle pour ce projet:\n\nSYNOPSIS: '+syn+'\nTYPE: '+prodType+'\nSTYLE: '+document.getElementById('style').value+'\n\nCrée:\n1. Narration d\'ouverture (30 sec)\n2. Narrations des scènes principales\n3. Narration de clôture\n4. Texte pour ElevenLabs (prêt à coller)', null, function(r){
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
  groq('Crée une FICHE TECHNIQUE CINÉMATOGRAPHIQUE PROFESSIONNELLE complète pour:\n\nTITRE: '+titre+'\nTYPE: '+prodType+'\nSTYLE: '+document.getElementById('style').value+'\nRATIO: '+document.getElementById('ratio').value+'\nSYNOPSIS: '+syn.substring(0,200)+'\n\nInclure: format de tournage, équipement caméra recommandé, éclairage, son, outils de montage, étalonage, distribution, festivals cibles.', null, function(r){
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
  groq('Génère un prompt image ULTRA-OPTIMISÉ pour Stable Diffusion XL / Leonardo AI.\n\nDESCRIPTION: '+desc+'\nSTYLE: '+document.getElementById('vis-style').value+'\n\nFormat:\n✅ POSITIVE PROMPT (anglais, très détaillé — composition, éclairage, caméra, qualité, style):\n[prompt]\n\n❌ NEGATIVE PROMPT:\n[prompt négatif]\n\n💡 VARIATIONS SUGGÉRÉES:\n[3 variations]', null, function(r){
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
  groq('Génère un prompt Stable Diffusion XL pour chaque scène du storyboard.\n\nSTYLE GLOBAL: '+style+'\nSCÈNES:\n'+txt+'\n\nFormat STRICT pour chaque ligne:\nSCÈNE N|prompt_anglais_détaillé\n\nUn seul pipe (|) par ligne. Pas de guillemets.', null, function(r){
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
