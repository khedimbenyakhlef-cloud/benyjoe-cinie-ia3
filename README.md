# 🎬 BENY-JOE CINIE IA — Studio Ultime v5

> **Fondé par KHEDIM BENYAKHLEF dit BENY-JOE**
> Propulsé par **Groq Llama 3.3 70B** — 100% Gratuit

---

## 📁 Structure professionnelle

```
benyjoe-cinie-ia/
├── server.js                    ← Point d'entrée principal
├── package.json                 ← Configuration projet
├── .gitignore                   ← Fichiers ignorés
├── README.md                    ← Documentation
│
├── backend/
│   ├── config/
│   │   └── env.js               ← Variables d'environnement
│   ├── middleware/
│   │   ├── logger.js            ← Logger HTTP coloré
│   │   └── rateLimiter.js       ← Protection anti-spam
│   ├── routes/
│   │   ├── index.js             ← Routeur principal
│   │   ├── api.js               ← Routes API REST
│   │   └── static.js            ← Serveur fichiers statiques
│   └── services/
│       ├── groq.js              ← Service Groq Llama 3.3 70B ✅ CORRIGÉ
│       ├── storage.js           ← Gestion exports & fichiers
│       └── http.js              ← Utilitaires HTTP
│
└── frontend/
    ├── index.html               ← Interface Studio complète
    ├── css/
    │   └── style.css            ← Thème cinéma doré
    └── js/
        └── modules/
            ├── core.js          ← Navigation, IA, Utilitaires
            ├── scenario.js      ← Génération scénario IA
            ├── import.js        ← Roman → Film
            ├── production.js    ← Plans de production
            ├── visuels.js       ← Storyboard & Prompts SD
            ├── montage.js       ← Timeline & Clips
            ├── assistant.js     ← Chat IA Cinéma 24h/24
            └── exports.js       ← Gestion productions
```

---

## 🚀 Déploiement Render.com

1. Push sur GitHub
2. Render → New Web Service → connecter repo
3. **Start Command** : `node server.js`
4. **Build Command** : `echo ok`
5. **Variable** : `GROQ_API_KEY` = `gsk_...`

## 🔑 Clé Groq (Gratuit)

→ https://console.groq.com → API Keys → Create

---

*© 2026 KHEDIM BENYAKHLEF dit BENY-JOE — Tous droits réservés*
