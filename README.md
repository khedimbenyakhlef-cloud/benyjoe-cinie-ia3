# 🎬 BENY-JOE CINIE IA — Studio Ultime v5

> **Fondé par KHEDIM BENYAKHLEF dit BENY-JOE**
> Propulsé par **Groq Llama 3.3 70B** — 100% Gratuit — 14 400 requêtes/jour

---

## 🚀 Lancer le projet

```bash
# 1. Vérifier Node.js
node --version   # >= 16.0.0

# 2. Définir la clé API Groq
export GROQ_API_KEY=gsk_...

# 3. Démarrer le studio
node server.js

# 4. Ouvrir dans le navigateur
http://localhost:10000
```

---

## 🔑 Obtenir la clé Groq (GRATUIT — 30 secondes)

1. Aller sur : https://console.groq.com
2. Sign up avec Google
3. Cliquer "API Keys" → "Create API Key"
4. Copier la clé (commence par `gsk_...`)
5. L'ajouter dans Render → Environment Variables

**Plan gratuit Groq :** 14 400 requêtes/jour · Llama 3.3 70B · Aucune carte bancaire

---

## ☁️ Déploiement sur Render.com (gratuit)

1. Créer un compte sur https://render.com
2. "New Web Service" → connecter le dépôt GitHub
3. **Build Command** : `echo ok`
4. **Start Command** : `node server.js`
5. **Environment Variable** :
   - Key : `GROQ_API_KEY`
   - Value : `gsk_...` ← ta clé Groq
6. Instance Type : **Free**
7. Deploy !

---

## 📦 Fonctionnalités v5

| Module | Description |
|--------|-------------|
| 📝 Scénario IA | Génération complète, personnages, dialogues, restructuration |
| 📚 Import | Roman/texte → adaptation cinéma automatique |
| 🎬 Production | Plan de production, prompts visuels, voix off, fiche technique |
| 🖼️ Visuels | Prompts SD XL optimisés + storyboard automatique |
| ✂️ Montage | Timeline 3 pistes + recommandations IA |
| 🤖 Assistant | Chat cinéma professionnel multi-modes |
| 📦 Produits Finaux | Visualisation, téléchargement, gestion exports |
| 🛠️ Outils | Catalogue 15+ outils IA gratuits |

---

## 📁 Structure des fichiers

```
server.js          ← Application complète (backend + frontend)
package.json       ← Métadonnées du projet
README.md          ← Ce fichier
_data/
  exports/         ← Fichiers exportés (téléchargeables depuis l'app)
```

---

## 🤖 Modèle IA — Groq Llama 3.3 70B

- ⚡ **Le plus rapide** — 300+ tokens/seconde
- 🆓 **14 400 requêtes/jour** gratuitement
- 🧠 **70 milliards de paramètres** — qualité professionnelle
- 🔒 **Clé dans variable d'environnement** — jamais dans le code
- ✅ Aucune carte bancaire requise

---

## ⚠️ Sécurité — Règle absolue

**NE JAMAIS mettre la clé API dans le code source !**

Toujours utiliser les variables d'environnement :
- En local : `export GROQ_API_KEY=gsk_...`
- Sur Render : Environment Variables → `GROQ_API_KEY`

---

*BENY-JOE CINIE IA v5 · Fondé par KHEDIM BENYAKHLEF dit BENY-JOE · Groq Llama 3.3 70B*
