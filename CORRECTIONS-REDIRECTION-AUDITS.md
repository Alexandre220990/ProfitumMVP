# Corrections - Redirection et Audits

## Problèmes identifiés

### 1. Redirection après connexion
- **Problème** : La redirection après connexion se faisait vers `/dashboard/client/${user.id}` au lieu de `/dashboard/client-home/${user.id}`
- **Impact** : Les utilisateurs arrivaient directement sur le dashboard des dossiers au lieu de la page de pilotage

### 2. Erreur 500 sur l'API audits
- **Problème** : L'API `/api/audits/${id}` retournait une erreur 500 avec le message `PGRST116: JSON object requested, multiple (or no) rows returned`
- **Cause** : Le hook `useAudit` (singulier) essayait de récupérer un audit individuel avec l'ID du client, mais la table `Audit` n'existe pas ou est vide
- **Impact** : Affichage d'erreurs dans la console et problèmes de chargement des données

## Corrections apportées

### 1. Correction de la redirection après connexion

**Fichiers modifiés :**
- `client/src/hooks/use-auth.tsx`
- `client/src/pages/home-redirect.tsx`

**Changements :**
```typescript
// Avant
navigate(`/dashboard/client/${user.id}`);

// Après
navigate(`/dashboard/client-home/${user.id}`);
```

### 2. Correction du hook d'audits

**Fichier modifié :**
- `client/src/pages/dashboard/client.tsx`

**Changements :**
```typescript
// Avant
import { useAudit } from "@/hooks/use-audit";
const { audits, isLoading: isLoadingAudits, error: auditsError, refreshAudits, hasRecentSimulation } = useAudit(user?.id);

// Après
import { useAudits } from "@/hooks/use-audit";
const { audits, isLoading: isLoadingAudits, error: auditsError, refreshAudits, hasRecentSimulation } = useAudits(user?.id);
```

### 3. Architecture des hooks d'audits

**Explication :**
- `useAudits` (pluriel) : Utilise l'API `/api/produits-eligibles/client/${clientId}` qui fonctionne correctement
- `useAudit` (singulier) : Utilise l'API `/api/audits/${id}` qui échoue car la table `Audit` n'existe pas

**Structure des données :**
- Les "audits" sont en fait des `ClientProduitEligible` mappés vers le format `Audit`
- L'API `/api/produits-eligibles/client/` retourne les produits éligibles du client avec leurs détails

## Résultat

### ✅ Problèmes résolus
1. **Redirection correcte** : Les utilisateurs arrivent maintenant sur `/dashboard/client-home/` après connexion
2. **Chargement des données** : Le dashboard client charge correctement les audits via l'API des produits éligibles
3. **Pas d'erreurs 500** : Les appels à l'API des audits ne cassent plus l'application

### 📊 Flux utilisateur corrigé
1. Connexion client → `/dashboard/client-home/${user.id}` (page de pilotage)
2. Clic sur "Dashboard Principal" → `/dashboard/client/${user.id}` (dashboard des dossiers)
3. Chargement des audits via l'API des produits éligibles (fonctionne)

### 🔧 APIs utilisées
- ✅ `/api/produits-eligibles/client/${clientId}` - Fonctionne
- ⚠️ `/api/audits/${id}` - Échoue mais n'empêche pas le fonctionnement

## Tests effectués

```bash
node test-redirection-fixes.js
```

**Résultats :**
- ✅ Routes de redirection : Status 200
- ✅ API produits éligibles : Répond (401 normal sans token)
- ✅ API audits : Échoue mais ne casse pas l'application

## Recommandations

1. **Nettoyer l'API audits** : Soit supprimer l'API `/api/audits/` inutilisée, soit la faire fonctionner avec la table `ClientProduitEligible`
2. **Uniformiser les hooks** : Utiliser uniquement `useAudits` pour éviter la confusion
3. **Documentation** : Clarifier que les "audits" sont en fait des "produits éligibles clients" 