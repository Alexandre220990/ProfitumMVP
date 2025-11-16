# 🎯 Prochaines étapes : Test et validation de la détection des rôles Expert

## ✅ État actuel - Ce qui est IMPLÉMENTÉ

### Backend ✅
1. **Route `/api/expert/login`** : Inclut les infos cabinet dans la réponse
   - Retourne `cabinet.id`, `cabinet.role`, `cabinet.permissions`
   - Fichier : `server/src/routes/auth.ts:427-452`

2. **Service `CabinetService.getExpertCabinetInfo()`** : Récupère les infos cabinet
   - Fichier : `server/src/services/cabinetService.ts`

3. **Route `/api/expert/cabinet/context`** : Retourne le contexte complet
   - Fichier : `server/src/routes/expert/cabinet.ts:93-123`

### Frontend ✅
1. **Hook `useCabinetContext`** : Récupère le contexte cabinet
   - Fichier : `client/src/hooks/useCabinetContext.ts`
   - Gère gracieusement les experts sans cabinet

2. **Dashboard Expert** : Intègre `useCabinetContext`
   - Fichier : `client/src/components/ui/expert-dashboard-optimized.tsx`
   - Affiche conditionnellement l'onglet "Gestion équipe" selon `canManageMembers`

3. **Composant `CabinetTeamManagement`** : Gestion d'équipe adaptative
   - Fichier : `client/src/components/cabinet/CabinetTeamManagement.tsx`
   - Filtre la hiérarchie selon le rôle (OWNER vs MANAGER)

### Base de données ✅
1. **12 cabinets créés** avec leurs owners respectifs
2. **12 CabinetMember** créés avec rôle `OWNER`
3. **0 experts sans cabinet** (tous les experts ont maintenant un cabinet)

---

## 🧪 ÉTAPES DE TEST

### Étape 1 : Tester la connexion Expert avec cabinet
**Objectif** : Vérifier que les infos cabinet sont bien retournées au login

**Actions** :
1. Se connecter en tant qu'expert (OWNER)
2. Ouvrir la console du navigateur
3. Vérifier dans la réponse de login que `user.cabinet` contient :
   ```json
   {
     "id": "uuid-du-cabinet",
     "role": "OWNER",
     "permissions": {
       "isOwner": true,
       "isManager": false,
       "canManageMembers": true
     }
   }
   ```

**Fichiers à vérifier** :
- `client/src/lib/auth-distinct.ts` : Vérifier que `loginExpert` stocke bien les infos cabinet
- `client/src/hooks/use-auth.tsx` : Vérifier que `user.cabinet` est bien préservé

### Étape 2 : Tester l'affichage du dashboard Expert
**Objectif** : Vérifier que l'onglet "Gestion équipe" apparaît pour les OWNER/MANAGER

**Actions** :
1. Se connecter en tant qu'expert OWNER
2. Aller sur `/expert/dashboard`
3. Vérifier que l'onglet "Gestion équipe" est visible
4. Cliquer sur l'onglet et vérifier que le composant `CabinetTeamManagement` s'affiche
5. Vérifier que la hiérarchie complète du cabinet s'affiche

**Tests à faire** :
- ✅ OWNER : Doit voir tout le cabinet (managers + experts)
- ✅ MANAGER : Doit voir uniquement son équipe (experts sous lui)
- ✅ EXPERT : Ne doit PAS voir l'onglet "Gestion équipe"

### Étape 3 : Tester le hook `useCabinetContext`
**Objectif** : Vérifier que le hook récupère correctement le contexte

**Actions** :
1. Ouvrir la console du navigateur
2. Vérifier les appels API vers `/api/expert/cabinet/context`
3. Vérifier que le contexte retourné contient :
   - `cabinet` : Informations du cabinet
   - `membership` : Informations du membership (rôle, statut)
   - `permissions` : Permissions calculées

**Cas à tester** :
- Expert avec cabinet (OWNER) : Doit retourner le contexte complet
- Expert avec cabinet (MANAGER) : Doit retourner le contexte avec `isManager: true`
- Expert avec cabinet (EXPERT) : Doit retourner le contexte avec `canManageMembers: false`
- Expert sans cabinet : Doit retourner `null` sans erreur

### Étape 4 : Tester la gestion d'équipe (OWNER)
**Objectif** : Vérifier que les fonctionnalités de gestion d'équipe fonctionnent

**Actions** :
1. Se connecter en tant qu'expert OWNER
2. Aller dans l'onglet "Gestion équipe"
3. Tester les fonctionnalités :
   - ✅ Voir la hiérarchie complète du cabinet
   - ✅ Ajouter un manager
   - ✅ Assigner un expert à un manager
   - ✅ Modifier le statut d'un membre
   - ✅ Actualiser les KPIs

### Étape 5 : Tester la gestion d'équipe (MANAGER)
**Objectif** : Vérifier que les managers voient uniquement leur équipe

**Actions** :
1. Créer un expert MANAGER (via admin ou script SQL)
2. Assigner des experts à ce manager
3. Se connecter en tant que MANAGER
4. Vérifier que :
   - ✅ L'onglet "Gestion équipe" est visible
   - ✅ Seuls les experts sous lui sont visibles
   - ✅ Il ne peut pas voir les autres managers ou l'owner

---

## 🔍 Points de vérification

### Backend
- [ ] La route `/api/expert/login` retourne bien `user.cabinet`
- [ ] `CabinetService.getExpertCabinetInfo()` fonctionne correctement
- [ ] La route `/api/expert/cabinet/context` retourne les bonnes permissions

### Frontend
- [ ] `useCabinetContext` récupère correctement le contexte
- [ ] Le dashboard affiche conditionnellement l'onglet "Gestion équipe"
- [ ] `CabinetTeamManagement` filtre correctement selon le rôle
- [ ] Les erreurs sont gérées gracieusement (expert sans cabinet)

### Base de données
- [ ] Tous les experts ont un `cabinet_id`
- [ ] Tous les experts approuvés ont un `CabinetMember` avec rôle `OWNER`
- [ ] Les experts refusés ont aussi un cabinet (mais pas de CabinetMember)

---

## 🐛 Problèmes potentiels à surveiller

1. **Expert sans cabinet** : Le hook `useCabinetContext` doit retourner `null` sans erreur
2. **Permissions manquantes** : Si `cabinet.permissions` est `null`, le dashboard doit gérer gracieusement
3. **Cache** : Vérifier que les permissions sont bien rafraîchies après modification
4. **Performance** : Le hook `useCabinetContext` fait un appel API à chaque chargement, considérer un cache

---

## 📝 Scripts SQL utiles

### Vérifier les cabinets et leurs owners
```sql
SELECT 
  c.id AS cabinet_id,
  c.name AS cabinet_name,
  e.id AS expert_id,
  e.name AS expert_name,
  e.email AS expert_email,
  cm.team_role,
  cm.status
FROM "Cabinet" c
INNER JOIN "CabinetMember" cm ON cm.cabinet_id = c.id
INNER JOIN "Expert" e ON e.id = cm.member_id
WHERE cm.team_role = 'OWNER'
ORDER BY c.name;
```

### Créer un MANAGER pour tester
```sql
-- 1. Créer un expert MANAGER
-- (via l'interface admin ou directement)

-- 2. Créer un CabinetMember avec rôle MANAGER
INSERT INTO "CabinetMember" (
  cabinet_id,
  member_id,
  member_type,
  team_role,
  status,
  manager_member_id,
  permissions,
  products,
  created_at
)
SELECT 
  c.id AS cabinet_id,
  'EXPERT_ID_ICI'::uuid AS member_id,
  'expert' AS member_type,
  'MANAGER' AS team_role,
  'active' AS status,
  cm.id AS manager_member_id, -- L'owner devient le manager du manager
  jsonb_build_object('canManageTeam', true) AS permissions,
  '[]'::jsonb AS products,
  NOW() AS created_at
FROM "Cabinet" c
INNER JOIN "CabinetMember" cm ON cm.cabinet_id = c.id AND cm.team_role = 'OWNER'
WHERE c.id = 'CABINET_ID_ICI'::uuid;
```

---

## ✅ Checklist finale

- [ ] Tous les experts ont un cabinet
- [ ] Tous les experts approuvés ont un CabinetMember OWNER
- [ ] La connexion expert retourne les infos cabinet
- [ ] Le dashboard affiche l'onglet "Gestion équipe" pour OWNER/MANAGER
- [ ] Le composant CabinetTeamManagement filtre correctement selon le rôle
- [ ] Les experts sans cabinet ne génèrent pas d'erreur
- [ ] Les permissions sont correctement calculées et affichées

---

## 🚀 Une fois les tests validés

1. **Documenter** les fonctionnalités dans la documentation utilisateur
2. **Créer des tests unitaires** pour les fonctions critiques
3. **Optimiser les performances** si nécessaire (cache, lazy loading)
4. **Ajouter des logs** pour le debugging en production

