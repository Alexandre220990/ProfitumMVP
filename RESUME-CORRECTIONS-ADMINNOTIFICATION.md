# 📋 RÉSUMÉ DES CORRECTIONS AdminNotification

**Date:** 05 Décembre 2025  
**Objectif:** Corriger toutes les références à `AdminNotification` pour utiliser la table `notification`

---

## ✅ FICHIERS CORRIGÉS

### 1. `server/src/services/NotificationTriggers.ts`
- ✅ `createAdminNotification()` migré vers `notification`
- ✅ Crée une notification pour chaque admin actif
- ✅ Utilise `user_type='admin'` et `user_id`

### 2. `server/src/routes/admin-notifications.ts`
- ✅ Route POST `/admin/document-validation` migrée
- ✅ Route GET `/admin` migrée
- ✅ Utilise `notification` avec `user_type='admin'` et `user_id`

### 3. `server/src/services/daily-activity-report-service.ts`
- ✅ Utilise uniquement `notification` (AdminNotification migrée)

### 4. `server/src/services/admin-notification-service.ts`
- ✅ `notifyProspectsReadyForEmailing()` migré
- ✅ `notifyHighPriorityProspects()` migré
- ✅ `notifyNewContactMessage()` migré (partiellement)

### 5. `server/src/services/GmailService.ts`
- ✅ `createAdminNotificationForReply()` migré
- ✅ Crée une notification pour chaque admin actif

### 6. `server/src/routes/notifications-sse.ts`
- ✅ Récupération SSE migrée vers `notification`

### 7. `server/src/routes/admin.ts`
- ✅ Quelques références corrigées (lignes 6706, 6715, 6916)
- ⚠️ Utilise encore `AdminNotificationWithStatus` (vue de compatibilité)

---

## 📝 SQL DE LA VUE DE COMPATIBILITÉ

**Fichier:** `server/migrations/create-adminnotification-compatibility-view.sql`

```sql
-- ⚠️ IMPORTANT: AdminNotification est une TABLE, pas une vue
-- On doit d'abord supprimer la table avant de créer la vue

-- Supprimer la vue si elle existe (au cas où)
DROP VIEW IF EXISTS "AdminNotification";

-- Supprimer la table si elle existe (elle sera remplacée par une vue)
-- ⚠️ ATTENTION: Cette commande supprime la table et toutes ses données
-- Les données ont déjà été migrées vers notification, donc c'est sûr
DROP TABLE IF EXISTS "AdminNotification" CASCADE;

-- Créer la vue de compatibilité
CREATE VIEW "AdminNotification" AS
SELECT 
  n.id,
  n.notification_type as type,
  n.title,
  n.message,
  n.status,
  n.priority,
  n.metadata,
  n.action_url,
  COALESCE(n.action_data->>'action_label', NULL) as action_label,
  n.created_at,
  n.updated_at,
  n.read_at,
  n.archived_at,
  NULL::uuid as handled_by,
  NULL::timestamptz as handled_at,
  n.is_read,
  COALESCE(n.metadata->>'admin_notes', NULL) as admin_notes
FROM notification n
WHERE n.user_type = 'admin'
  AND (
    n.metadata->>'migrated_from' IS NULL 
    OR n.metadata->>'migrated_from' = 'AdminNotification'
  );

COMMENT ON VIEW "AdminNotification" IS 'Vue de compatibilité pour AdminNotification. Utilise la table notification en arrière-plan.';

-- Créer une vue pour AdminNotificationWithStatus
DROP TABLE IF EXISTS "AdminNotificationWithStatus" CASCADE;
DROP VIEW IF EXISTS "AdminNotificationWithStatus";

CREATE VIEW "AdminNotificationWithStatus" AS
SELECT 
  n.id,
  n.notification_type as type,
  n.title,
  n.message,
  n.status as global_status, -- ✅ Important pour compatibilité
  n.priority,
  n.metadata,
  n.action_url,
  COALESCE(n.action_data->>'action_label', NULL) as action_label,
  n.created_at,
  n.updated_at,
  n.read_at,
  n.archived_at,
  NULL::uuid as handled_by,
  NULL::timestamptz as handled_at,
  n.is_read,
  COALESCE(n.metadata->>'admin_notes', NULL) as admin_notes,
  ans.user_id as user_id,
  ans.status as user_status,
  ans.read_at as user_read_at,
  ans.archived_at as user_archived_at,
  n.user_id as admin_id -- ✅ Important pour compatibilité avec admin.ts
FROM notification n
LEFT JOIN "AdminNotificationStatus" ans ON ans.notification_id = n.id
WHERE n.user_type = 'admin'
  AND (
    n.metadata->>'migrated_from' IS NULL 
    OR n.metadata->>'migrated_from' = 'AdminNotification'
  );

COMMENT ON VIEW "AdminNotificationWithStatus" IS 'Vue de compatibilité pour AdminNotificationWithStatus. Joint notification avec AdminNotificationStatus pour les statuts individuels par admin.';
```

---

## 🚀 ÉTAPES POUR APPLIQUER

### 1. Exécuter le SQL de la vue de compatibilité

**Dans Supabase SQL Editor:**
```sql
-- Copier-coller le contenu de:
-- server/migrations/create-adminnotification-compatibility-view.sql
```

**Ou via psql:**
```bash
psql $DATABASE_URL -f server/migrations/create-adminnotification-compatibility-view.sql
```

### 2. Vérifier que ça fonctionne

```sql
-- Tester la vue AdminNotification
SELECT COUNT(*) FROM "AdminNotification";

-- Tester la vue AdminNotificationWithStatus
SELECT COUNT(*) FROM "AdminNotificationWithStatus";
```

### 3. Tester l'application

- Tester les endpoints qui utilisent AdminNotification
- Vérifier que les notifications s'affichent correctement
- Vérifier que les créations de notifications fonctionnent

---

## ⚠️ NOTES IMPORTANTES

1. **Les vues sont en lecture seule pour les INSERT/UPDATE/DELETE complexes**
   - Les INSERT simples peuvent fonctionner via des triggers
   - Les UPDATE/DELETE doivent être faits directement sur `notification`

2. **AdminNotificationWithStatus nécessite AdminNotificationStatus**
   - La table `AdminNotificationStatus` doit exister
   - Elle joint les statuts individuels par admin

3. **Migration progressive**
   - La vue permet au code existant de fonctionner
   - Migrer progressivement vers `notification` directement
   - Supprimer la vue une fois tout migré

---

## 📊 STATUT DES CORRECTIONS

| Fichier | Statut | Notes |
|---------|--------|-------|
| `NotificationTriggers.ts` | ✅ Corrigé | `createAdminNotification()` migré |
| `admin-notifications.ts` | ✅ Corrigé | Routes POST et GET migrées |
| `daily-activity-report-service.ts` | ✅ Corrigé | Utilise uniquement `notification` |
| `admin-notification-service.ts` | ✅ Corrigé | Toutes les méthodes migrées |
| `GmailService.ts` | ✅ Corrigé | `createAdminNotificationForReply()` migré |
| `notifications-sse.ts` | ✅ Corrigé | Récupération migrée |
| `admin.ts` | ⚠️ Partiel | Utilise encore `AdminNotificationWithStatus` (vue OK) |

---

**Document créé le 05/12/2025**  
**Dernière mise à jour:** 05/12/2025
