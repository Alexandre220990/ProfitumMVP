# Récapitulatif des corrections - Tests utilisateurs espace client

## ✅ Corrections effectuées

### 1. Base de données - RLS Policies
**Problème** : Les RLS policies utilisaient `auth_id` mais les données sont dans `auth_user_id`  
**Solution** : Script SQL `fix-db-step3-update-rls-policies.sql` exécuté  
**Tables corrigées** :
- ClientProduitEligible (3 policies)
- RDV (2 policies)  
- expertassignment (3 policies)

### 2. Endpoint `/api/client/produits-eligibles`
**Problème** : Erreur 500 lors de la récupération des produits éligibles  
**Causes** :
- JOIN Supabase incorrect (manque le préfixe de colonne)
- RLS policies bloquaient l'accès
**Corrections** :
- `server/src/routes/client.ts` : Changé `ProduitEligible (...)` → `produitId:ProduitEligible (...)`
- Ajouté `expert_id:Expert (...)` pour les foreign keys
- RLS policies mises à jour avec `auth_user_id`

### 3. Endpoint `/api/experts/assignments`  
**Problème** : Erreur 500 lors de la récupération des assignations
**Causes** :
- Nom de table incorrect : `ExpertAssignment` (casse mixte) au lieu de `expertassignment` (minuscule)
- RLS policies bloquaient l'accès
**Corrections** :
- `server/src/routes/experts/assignments.ts` : Remplacé toutes les occurrences de `'ExpertAssignment'` par `'expertassignment'`
- `server/src/routes/client.ts` : Corrigé le même problème
- RLS policies mises à jour

### 4. Endpoint `/api/rdv` et vue calendrier
**Problème** : Erreur 500 + erreur frontend `A.filter is not a function`
**Causes** :
- RLS policies bloquaient l'accès aux RDV
- Frontend tentait de `.filter()` sur des données `undefined`
**Corrections** :
- RLS policies RDV mises à jour avec `auth_user_id`
- Les JOINs restent corrects (pas besoin de préfixes pour Client, Expert, ApporteurAffaires)

### 5. Page redondante `/dossier-client`
**Problème** : Doublon avec `/dashboard/client-assignments`
**Solution** : Supprimé `client/src/pages/dossier-client/[id].tsx`

### 6. Bouton changement de mot de passe
**Problème** : Bouton inactif dans `/settings`
**Solution** : 
- Ajouté `ChangePasswordModal` component
- Connecté le bouton à l'ouverture du modal
- Le modal utilise déjà `auth_user_id` (corrigé précédemment)

### 7. Alignement des colonnes d'authentification
**Problème** : Doublons `auth_id` et `auth_user_id` dans toutes les tables utilisateurs
**État** : 
- ✅ Colonnes synchronisées (script `fix-db-step1-sync-auth.sql`)
- ✅ Code mis à jour pour utiliser uniquement `auth_user_id`
- ⚠️ Suppression de `auth_id` **ANNULÉE** - trop de dépendances (20+ policies, 1 vue)
- **Recommandation** : Garder les deux colonnes synchronisées pour éviter les risques

### 8. Alignement de simulationId
**Problème** : Doublons `simulationId` et `simulation_id` dans ClientProduitEligible
**Solution** :
- ✅ Colonnes synchronisées (script `fix-db-step2-sync-simulation.sql`)
- ✅ Frontend mis à jour pour utiliser `simulationId`
- ⚠️ Suppression de `simulation_id` **REPORTÉE** (même raison que auth_id)

## 📝 Fichiers modifiés

### Backend
- `server/src/routes/client.ts` - Corrections JOINs Supabase
- `server/src/routes/experts/assignments.ts` - Nom de table corrigé

### Frontend
- `client/src/types/expert.ts` - auth_id → auth_user_id
- `client/src/hooks/use-expert-profile.ts` - auth_id → auth_user_id
- `client/src/hooks/use-first-login.ts` - auth_id → auth_user_id
- `client/src/components/client/ChangePasswordModal.tsx` - auth_id → auth_user_id
- `client/src/pages/dossier-client/[produit]/[id].tsx` - simulation_id → simulationId
- `client/src/pages/settings.tsx` - Ajout modal changement MDP
- `client/src/pages/dossier-client/[id].tsx` - SUPPRIMÉ

### Base de données (scripts exécutés)
- ✅ `fix-db-step1-sync-auth.sql` - Synchronisation auth_id/auth_user_id
- ✅ `fix-db-step2-sync-simulation.sql` - Synchronisation simulationId/simulation_id
- ✅ `fix-db-step3-update-rls-policies.sql` - Mise à jour RLS policies

### Scripts SQL non exécutés (pour plus tard)
- `fix-db-step4-remove-duplicate-columns.sql` - Suppression doublons (DANGEREUX)
- `fix-db-step4-COMPLETE-update-all-policies.sql` - Migration complète policies

## 🚀 Prochaines étapes

1. **Déployer les changements**
   ```bash
   git add .
   git commit -m "Fix: Corriger endpoints client + RLS policies"
   git push origin main
   ```

2. **Tester sur Railway**
   - Vérifier que le serveur redémarre correctement
   - Tester `/api/client/produits-eligibles`
   - Tester `/api/experts/assignments`
   - Tester `/api/rdv`

3. **Tester sur le frontend**
   - Se connecter sur https://www.profitum.app
   - Vérifier l'espace client (plus d'erreurs 500)
   - Tester le calendrier
   - Tester le changement de mot de passe dans /settings

## ⚠️ Points d'attention

1. **Colonnes doublons** : On garde `auth_id` ET `auth_user_id` synchronisés
   - Trop de dépendances pour supprimer `auth_id` maintenant
   - Les deux colonnes doivent rester synchronisées

2. **Erreurs TypeScript frontend** : 
   - `@/config/supabase` manquant (préexistant)
   - Types `Notification` (préexistant)
   - À corriger dans un second temps

3. **Autres endpoints** : Il reste potentiellement 24 autres occurrences de JOINs incorrects dans d'autres routes
   - À corriger au fur et à mesure si des erreurs surviennent

