# 🚀 Déploiement Railway - Corrections Simulation

**Date:** 17 octobre 2025  
**Problème:** Code corrigé non déployé sur Railway  
**Status:** Nécessite redéploiement

---

## ⚠️ Situation Actuelle

### Production Railway
- ❌ Tourne sur **ancienne version** du code
- ❌ Appelle encore les fonctions RPC manquantes
- ❌ Retourne erreur 400 au calcul d'éligibilité

### GitHub (Origin/Main)
- ✅ **Code corrigé** pushé (commit `d999ff1`)
- ✅ Conversion UUID → question_id
- ✅ Endpoints `/response` et `/calculate-eligibility` corrigés

---

## 🔄 Options de Déploiement

### Option 1: Auto-Deploy Railway (RECOMMANDÉ)

Railway devrait détecter automatiquement le push Git et redéployer.

**Vérifier dans Railway Dashboard:**
1. Aller sur https://railway.app
2. Sélectionner projet **ProfitumMVP**
3. Onglet **Deployments**
4. Vérifier si un nouveau déploiement est en cours

**Si auto-deploy est activé:**
- Attendre 2-5 minutes
- Le nouveau build devrait démarrer automatiquement
- Surveiller les logs de déploiement

### Option 2: Déploiement Manuel via CLI

```bash
# 1. Installer Railway CLI (si pas déjà fait)
npm install -g @railway/cli

# 2. Login Railway
railway login

# 3. Lier au projet
railway link

# 4. Déployer
railway up
```

### Option 3: Déploiement via Dashboard

1. Aller sur Railway Dashboard
2. Sélectionner le projet
3. Cliquer sur **"Deploy"** ou **"Redeploy"**
4. Attendre la fin du build

### Option 4: Forcer un Redéploiement (Push vide)

```bash
# Si Railway n'a pas détecté le push
git commit --allow-empty -m "chore: force railway redeploy"
git push origin main
```

---

## ✅ Vérification du Déploiement

### 1. Logs Railway
```bash
# Via CLI
railway logs

# Ou dans Dashboard → Deployments → Logs
```

**Chercher ces logs au démarrage:**
```
✅ Server démarré sur port 3000
✅ Connection Supabase établie
✅ Routes chargées : /api/simulator/*
```

### 2. Test de Santé
```bash
# Vérifier que le serveur répond
curl https://profitummvp-production.up.railway.app/api/health

# Résultat attendu:
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2025-10-17T08:35:00.000Z"
}
```

### 3. Test du Nouveau Code

Une fois déployé, tester:

```bash
# Test sauvegarde réponses (devrait déjà fonctionner)
curl -X POST https://profitummvp-production.up.railway.app/api/simulator/response \
  -H "Content-Type: application/json" \
  -d '{
    "session_token": "test-123",
    "responses": {"uuid-question": "value"}
  }'

# Test calcul éligibilité (devrait maintenant fonctionner)
curl -X POST https://profitummvp-production.up.railway.app/api/simulator/calculate-eligibility \
  -H "Content-Type: application/json" \
  -d '{"session_token": "test-123"}'
```

---

## 📊 Logs de Déploiement Attendus

```bash
#0 building with "default" instance using docker driver

#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile: 32B done
#1 DONE 0.0s

#2 [internal] load .dockerignore
#2 transferring context: 2B done
#2 DONE 0.0s

#3 [internal] load metadata for docker.io/library/node:18
#3 DONE 0.2s

#4 [1/6] FROM docker.io/library/node:18
...
#9 [6/6] RUN npm run build
#9 DONE 45.2s

#10 exporting to image
#10 DONE 2.1s

✅ Build successful
✅ Deploying to production...
✅ Deployment successful
✅ Service is live at: profitummvp-production.up.railway.app
```

---

## 🎯 Checklist Post-Déploiement

Une fois déployé, vérifier:

- [ ] Serveur répond (health check)
- [ ] Pas d'erreur dans les logs Railway
- [ ] POST /api/simulator/response → 200 OK
- [ ] POST /api/simulator/calculate-eligibility → 200 OK (plus de 400!)
- [ ] Logs montrent conversion UUID → question_id
- [ ] ClientProduitEligible créés en BDD
- [ ] Frontend affiche les produits éligibles avec montants

---

## 🔍 Debugging si Problème Persiste

### Vérifier la version déployée

```bash
# Dans les logs Railway, chercher le commit hash
# Doit être: d999ff1 ou plus récent

# Vérifier la date du déploiement
# Doit être après 17/10/2025 08:31
```

### Vérifier le build

```bash
railway logs --deployment [DEPLOYMENT_ID]

# Chercher les erreurs de compilation
# S'assurer que tous les fichiers sont inclus
```

### Variables d'Environnement

Vérifier dans Railway Dashboard → Variables:
```
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
✅ JWT_SECRET
✅ NODE_ENV=production
```

---

## 🚨 Si Railway Ne Redéploie Pas

### Forcer le redéploiement

```bash
# Option A: Push vide
git commit --allow-empty -m "chore: force redeploy"
git push origin main

# Option B: Via CLI Railway
railway up --detach

# Option C: Via Dashboard
# Cliquer sur "Redeploy" dans l'interface
```

---

## 📞 Support Railway

Si problème persiste:
- Documentation: https://docs.railway.app
- Status: https://status.railway.app
- Discord: https://discord.gg/railway

---

## ⏱️ Temps Estimé

- **Auto-deploy:** 2-5 minutes après push
- **Build:** ~2-3 minutes  
- **Déploiement:** ~30 secondes
- **Total:** ~3-8 minutes

---

**✅ Une fois déployé, retestez la simulation - tout devrait fonctionner !**

