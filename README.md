# 🎬 BENY-JOE CINIE IA — Studio Ultime v4

> **Fondé par KHEDIM BENYAKHLEF dit BENY-JOE**
> Propulsé par **Google Gemini 2.0 Flash** — 100% Gratuit

---

## 🚀 Lancer le projet

```bash
# 1. Installer (aucune dépendance npm requise — Node.js natif uniquement)
node --version   # Vérifier >= 16.0.0

# 2. (Recommandé) Définir la clé API en variable d'environnement
export GEMINI_API_KEY=AIza...

# 3. Démarrer le studio
node server.js

# 4. Ouvrir dans le navigateur
http://localhost:3000
```

---

## 🔑 Obtenir la clé Gemini (GRATUIT)

1. Aller sur : https://aistudio.google.com/app/apikey
2. Cliquer "Create API Key"
3. Copier la clé (commence par `AIza...`)
4. La coller dans l'onglet ⚙️ **Config** de l'application
   — ou définir `GEMINI_API_KEY=AIza...` en variable d'environnement

**Plan gratuit :** 1500 requêtes/jour · Gemini 2.0 Flash · Aucune carte bancaire

---

## 📦 Fonctionnalités v4 Ultimate

| Module | Description |
|--------|-------------|
| 📝 Scénario IA | Génération complète, personnages, dialogues, restructuration |
| 📚 Import | Roman/texte → adaptation cinéma automatique |
| 🎬 Production | Plan de production, prompts visuels, voix off, fiche technique |
| 🖼️ Visuels | Prompts SD XL optimisés + storyboard automatique |
| ✂️ Montage | Timeline 3 pistes + recommandations IA |
| 🤖 Assistant | Chat cinéma professionnel multi-modes |
| 📦 **Produits Finaux** | Visualisation, téléchargement, gestion de tous les exports |
| 🛠️ Outils | Catalogue 15+ outils IA gratuits |

---

## 📁 Structure des fichiers

```
server.js          ← Application complète (backend + frontend)
package.json       ← Métadonnées du projet
README.md          ← Ce fichier
_data/
  config.json      ← Clé API (générée automatiquement)
  exports/         ← Fichiers exportés (téléchargeables depuis l'app)
```

---

## ☁️ Déploiement sur Render.com (gratuit)

1. Créer un compte sur https://render.com
2. "New Web Service" → connecter votre dépôt GitHub
3. Build command : `npm install` (ou laisser vide)
4. Start command : `node server.js`
5. Ajouter la variable d'environnement `GEMINI_API_KEY`
6. Deploy !

---

## 🤖 Modèle IA

**Gemini 2.0 Flash** — Le modèle Google IA le plus récent et le plus rapide :
- 8192 tokens par réponse
- Temperature 0.82 (créatif mais cohérent)
- 100% gratuit jusqu'à 1500 req/jour

---

*BENY-JOE CINIE IA v4 · Fondé par KHEDIM BENYAKHLEF dit BENY-JOE*
