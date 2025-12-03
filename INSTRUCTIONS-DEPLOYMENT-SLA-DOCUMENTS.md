# 🚀 INSTRUCTIONS DE DÉPLOIEMENT - Système SLA Notifications Documents

**Date** : 3 Décembre 2025  
**Système** : Notifications SLA en cascade pour documents à valider

---

## ✅ **CE QUI A ÉTÉ FAIT**

### **Fichiers créés** :
1. ✅ `server/src/services/document-validation-reminder-service.ts` - Service de rappel SLA
2. ✅ `server/src/cron/document-validation-reminders.ts` - Cron job (toutes les heures à :30)
3. ✅ `server/src/scripts/create-missing-document-notifications.ts` - Script de rattrapage

### **Fichiers modifiés** :
1. ✅ `server/src/config/notification-sla-config.ts` - Ajout config SLA
2. ✅ `server/src/index.ts` - Activation du cron job
3. ✅ `server/src/routes/admin-notifications-new.ts` - Filtre status='replaced'
4. ✅ `server/src/routes/admin-notifications.ts` - Filtre status='replaced'

---

## 🎯 **PROCHAINES ÉTAPES (À FAIRE MAINTENANT)**

### **ÉTAPE 1 : Exécuter le script de rattrapage** ⚠️ **IMPORTANT**

Ce script va créer les notifications initiales pour les **25 dossiers existants** en attente de validation.

```bash
cd /Users/alex/Desktop/FinancialTracker/server

# Option A : Avec npx (recommandé)
npx ts-node src/scripts/create-missing-document-notifications.ts

# Option B : Avec node (si compilé)
npm run build
node dist/scripts/create-missing-document-notifications.js
```

**Résultat attendu** :
```
🚀 Démarrage du script de rattrapage des notifications...
🔄 [Script Rattrapage] Début de la création des notifications manquantes...
📊 25 dossier(s) en attente trouvé(s)
📊 2 admin(s) actif(s) trouvé(s)
✅ Notification créée pour dossier xxx (admin admin@example.com)
...
📊 RÉSUMÉ :
  ✅ 50 notification(s) créée(s) (25 dossiers × 2 admins)
  ⏭️  0 notification(s) déjà existante(s)
  📁 25 dossier(s) traité(s)
  👥 2 admin(s) notifié(s)

✅ Script de rattrapage terminé avec succès !
👋 Script terminé. Vous pouvez maintenant vérifier le centre de notifications admin.
```

---

### **ÉTAPE 2 : Vérifier dans Supabase**

```sql
-- 1. Compter les notifications créées
SELECT COUNT(*) as total
FROM notification
WHERE notification_type = 'admin_action_required'
  AND action_data->>'action_required' = 'validate_eligibility'
  AND status = 'unread';
-- Résultat attendu : ~50 (25 dossiers × 2 admins)

-- 2. Voir les détails
SELECT 
  n.id,
  n.title,
  n.priority,
  n.action_data->>'client_produit_id' as dossier_id,
  n.created_at,
  a.email as admin_email
FROM notification n
LEFT JOIN "Admin" a ON a.auth_user_id = n.user_id
WHERE n.notification_type = 'admin_action_required'
  AND n.status = 'unread'
ORDER BY n.created_at DESC
LIMIT 20;

-- 3. Vérifier qu'aucune notification n'a status='replaced' encore
SELECT status, COUNT(*) 
FROM notification 
WHERE notification_type IN ('admin_action_required', 'documents_pending_validation_reminder')
GROUP BY status;
-- Résultat attendu : 
-- status='unread' : 50
-- status='replaced' : 0 (pour le moment)
```

---

### **ÉTAPE 3 : Redémarrer le serveur**

```bash
# Le cron job démarre automatiquement au démarrage du serveur
# Surveiller les logs pour confirmer :

# Dans les logs, vous devriez voir :
✅ Cron job rappels SLA documents activé (toutes les heures à :30)
```

---

### **ÉTAPE 4 : Vérifier le centre de notifications (Frontend)**

1. **Se connecter en tant qu'admin**
2. **Ouvrir le centre de notifications** (icône cloche)
3. **Vérifier** :
   - ✅ Toutes les notifications apparaissent
   - ✅ Filtrer par "Non lues" → ~50 notifications visibles
   - ✅ Les titres commencent par "📄 Documents à valider"
   - ✅ Cliquer sur "Voir détails" redirige vers `/admin/dossiers/{id}`

---

### **ÉTAPE 5 : Tester le système de remplacement (Optionnel mais recommandé)**

#### **Test A : Simuler un dossier en attente depuis 25h**

```sql
-- 1. Choisir un dossier de test
SELECT id, created_at, admin_eligibility_status
FROM "ClientProduitEligible"
WHERE admin_eligibility_status = 'pending'
LIMIT 1;

-- 2. Modifier pour simuler 25 heures
UPDATE "ClientProduitEligible"
SET 
  created_at = NOW() - INTERVAL '25 hours',
  updated_at = NOW() - INTERVAL '25 hours',
  metadata = '{}'::jsonb
WHERE id = 'ID_DU_DOSSIER_CHOISI';

-- 3. Attendre l'exécution du cron (prochaine heure à :30)
-- OU forcer manuellement l'exécution (voir plus bas)

-- 4. Vérifier qu'une notification SLA 24h a été créée
SELECT 
  notification_type,
  title,
  action_data->>'threshold' as threshold,
  status,
  created_at
FROM notification 
WHERE action_data->>'client_produit_id' = 'ID_DU_DOSSIER_CHOISI'
ORDER BY created_at DESC;

-- Résultat attendu :
-- 1. documents_pending_validation_reminder | 24h | unread | (maintenant)
-- 2. admin_action_required | null | replaced | (il y a 25h)
```

#### **Test B : Forcer l'exécution manuelle du cron (pour tests immédiats)**

Créer une route de test temporaire :

```typescript
// Dans server/src/index.ts ou un fichier de routes de test
import { checkDocumentValidationRemindersNow } from './cron/document-validation-reminders';

app.get('/api/test/trigger-document-sla-check', async (req, res) => {
  try {
    await checkDocumentValidationRemindersNow();
    res.json({ success: true, message: 'Check SLA documents exécuté' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

Puis appeler : `GET http://localhost:3000/api/test/trigger-document-sla-check`

---

## 📊 **SURVEILLANCE POST-DÉPLOIEMENT**

### **Logs à surveiller**

```bash
# Voir les exécutions du cron
grep "Document SLA Reminder" logs/*.log | tail -20

# Voir les notifications créées
grep "Notification.*créée" logs/*.log | grep "Document SLA" | tail -20

# Voir les remplacements
grep "remplacée(s)" logs/*.log | tail -20
```

### **Requêtes de monitoring**

```sql
-- 1. Nombre de notifications SLA actives par seuil
SELECT 
  action_data->>'threshold' as threshold,
  COUNT(*) as count
FROM notification 
WHERE notification_type = 'documents_pending_validation_reminder'
  AND status = 'unread'
GROUP BY threshold
ORDER BY threshold;

-- 2. Nombre de dossiers en attente SANS notification active
SELECT COUNT(*) as dossiers_sans_notification
FROM "ClientProduitEligible" cpe
WHERE (cpe.admin_eligibility_status = 'pending' OR cpe.admin_eligibility_status IS NULL)
  AND NOT EXISTS (
    SELECT 1 FROM notification n
    WHERE (n.action_data->>'client_produit_id' = cpe.id 
           OR n.metadata->>'client_produit_id' = cpe.id)
      AND n.notification_type IN ('admin_action_required', 'documents_pending_validation_reminder')
      AND n.status != 'replaced'
  );
-- Résultat attendu : 0

-- 3. Historique des remplacements
SELECT 
  notification_type,
  action_data->>'threshold' as threshold,
  metadata->>'replaced_threshold' as ancien_threshold,
  status,
  COUNT(*) as count
FROM notification 
WHERE status = 'replaced'
  AND notification_type IN ('admin_action_required', 'documents_pending_validation_reminder')
GROUP BY notification_type, threshold, ancien_threshold, status;
```

---

## ⚠️ **EN CAS DE PROBLÈME**

### **Problème : Script de rattrapage échoue**

```bash
# Vérifier les variables d'environnement
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Vérifier la connexion Supabase
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"ClientProduitEligible\" WHERE admin_eligibility_status = 'pending';"
```

### **Problème : Notifications ne s'affichent pas**

```sql
-- Vérifier que les notifications existent
SELECT COUNT(*) FROM notification 
WHERE notification_type = 'admin_action_required' 
  AND status = 'unread';

-- Vérifier que l'API filtre correctement
-- Chercher dans le code : .neq('status', 'replaced')
```

### **Problème : Doublons de notifications**

```sql
-- Identifier les doublons
SELECT 
  user_id,
  action_data->>'client_produit_id' as dossier_id,
  notification_type,
  status,
  COUNT(*) as count
FROM notification 
WHERE notification_type IN ('admin_action_required', 'documents_pending_validation_reminder')
GROUP BY user_id, action_data->>'client_produit_id', notification_type, status
HAVING COUNT(*) > 1;

-- Si des doublons existent avec status='unread', les nettoyer :
-- Garder la plus récente, remplacer les autres
```

---

## 📚 **DOCUMENTATION COMPLÈTE**

Voir le fichier : `SYSTEME-SLA-NOTIFICATIONS-DOCUMENTS.md`

---

## ✅ **CHECKLIST FINALE**

- [ ] ✅ Script de rattrapage exécuté avec succès
- [ ] ✅ 50 notifications créées dans Supabase (vérification SQL)
- [ ] ✅ Serveur redémarré avec cron actif
- [ ] ✅ Notifications visibles dans le centre de notification admin
- [ ] ✅ Aucun doublon affiché
- [ ] ✅ Clic sur "Voir détails" fonctionne
- [ ] ✅ Test de remplacement 24h → 48h effectué (optionnel)
- [ ] ✅ Logs surveillés pendant 24h

---

**Statut actuel** : ⏳ En attente de déploiement  
**Prochain déploiement** : Exécuter le script de rattrapage ci-dessus

**Questions ?** Vérifier la documentation complète ou consulter les logs.

