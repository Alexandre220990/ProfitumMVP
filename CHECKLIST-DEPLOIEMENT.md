# ✅ Checklist de Vérification - Déploiement Railway

**Date:** 17 octobre 2025  
**Commit:** fcc7ffb

---

## 🔍 Après le Redéploiement, Vérifiez :

### 1. Railway Dashboard

**URL:** https://railway.app/project/ProfitumMVP

✅ **Deployment Status**
- [ ] Build réussi (vert)
- [ ] Service "Running"
- [ ] Aucune erreur dans les logs
- [ ] Dernier commit: `fcc7ffb` ou plus récent

✅ **Logs de Démarrage**
Cherchez ces lignes dans les logs:
```
✅ Server démarré sur port 5001
✅ Connection Supabase établie
✅ Routes chargées
```

---

### 2. Test de l'API en Production

#### Test 1: Health Check
```bash
curl https://profitummvp-production.up.railway.app/api/health
```

**Résultat attendu:**
```json
{"status":"ok","timestamp":"..."}
```

#### Test 2: Endpoint Calculate Eligibility
```bash
curl -X POST https://profitummvp-production.up.railway.app/api/simulator/calculate-eligibility \
  -H "Content-Type: application/json" \
  -d '{"session_token":"test-token"}'
```

**AVANT (400 Bad Request):**
```json
{"success":false,"message":"Route non trouvée"}
```

**APRÈS (devrait être 404 ou 500 si token invalide, mais PAS "Route non trouvée"):**
```json
{"success":false,"error":"Simulation non trouvée"}
```

---

### 3. Test Complet en Production

1. **Allez sur:** https://www.profitum.app/simulateur-client
2. **Connectez-vous** en tant que client
3. **Répondez** aux 15 questions
4. **Cliquez** sur "Calculer mes économies"

**Logs attendus dans Railway:**
```
🎯 Calcul d'éligibilité pour la session: f9552363...
📋 Simulation trouvée
📝 Réponses disponibles: 15
📝 Réponses brutes (UUIDs): [...]
🔄 Conversion: 15 UUIDs → 15 question_id
📝 Question IDs convertis: [GENERAL_001, GENERAL_002, ...]

🎯 DÉBUT ÉVALUATION ÉLIGIBILITÉ
🎯 Évaluation produit: TICPE
  ✅ Règle satisfaite
📊 TICPE: 1/1 règles - ✅ ÉLIGIBLE

✅ RÉSULTAT: 5/10 produits éligibles
✅ 10 ClientProduitEligible créés (5 éligibles, 5 non éligibles)
📦 5 ClientProduitEligible récupérés
```

**Frontend devrait afficher:**
```
✅ Simulation Terminée !
✅ 5 produits éligibles trouvés

1. TICPE - 15 000€
2. URSSAF - 122 500€
3. DFS - 5 400€
4. Optimisation Énergie - 18 000€
5. Chronotachygraphes - À estimer
```

---

### 4. Vérification Base de Données

```sql
-- Voir les simulations complétées récentes
SELECT 
  id,
  status,
  jsonb_object_keys(answers) as question_count,
  (results->>'eligible_count')::int as nb_eligibles,
  created_at
FROM simulations
WHERE status = 'completed'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 5;

-- Voir les ClientProduitEligible créés
SELECT 
  p.nom as produit,
  cpe.statut,
  cpe."montantFinal",
  cpe.created_at
FROM "ClientProduitEligible" cpe
JOIN "ProduitEligible" p ON p.id = cpe."produitId"
WHERE cpe.created_at > NOW() - INTERVAL '1 hour'
ORDER BY cpe.created_at DESC;
```

**Résultat attendu:**
```
✅ Au moins 1 simulation complétée
✅ Au moins 5-10 ClientProduitEligible créés
✅ montantFinal > 0 pour les éligibles
```

---

## ⏱️ Temps de Déploiement

**Timeline:**
- 08:31 - Push commit `fcc7ffb`
- 08:32-08:35 - Build Railway (2-4 min)
- 08:35-08:36 - Déploiement (~30 sec)
- 08:36 - **Service disponible**

**Vérifiez à partir de 08:36** (environ 5 min après le push)

---

## 🚨 Si Problème Persiste

### Erreur "Route non trouvée"

**Signifie:** Le fichier `simulator.ts` n'est pas compilé ou chargé

**Solutions:**
1. Vérifier `server/src/routes/index.ts` importe bien `simulatorRoutes`
2. Vérifier `dist/routes/simulator.js` existe après build
3. Vérifier les logs Railway pour erreurs de compilation

### Erreur TypeScript

**Si logs montrent:**
```
Error: Cannot find module '../services/simulationProcessor'
```

**Solution:** Vérifier que le fichier est bien exporté:
```typescript
// server/src/services/simulationProcessor.ts
export async function traiterSimulation(...) { ... }
```

### Import Path Error

**Si erreur de path:**
```
Error: Cannot find module './services/simulationProcessor.js'
```

**Solution:** Utiliser `.ts` en développement, build créera `.js`
```typescript
import { traiterSimulation } from '../services/simulationProcessor';
// Pas de .js ni .ts dans l'import !
```

---

## ✅ Commit Final

**Hash:** `fcc7ffb`  
**Message:** "fix: import statique traiterSimulation pour production Railway"  
**Fichier:** `server/src/routes/simulator.ts`

**Changement clé:**
```typescript
// ❌ AVANT (import dynamique - problème en prod)
const { traiterSimulation } = await import('../services/simulationProcessor.js');

// ✅ APRÈS (import statique - fonctionne partout)
import { traiterSimulation } from '../services/simulationProcessor';
```

---

**⏰ Attendez 5 minutes puis retestez !**

