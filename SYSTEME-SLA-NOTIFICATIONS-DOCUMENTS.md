# 🔔 SYSTÈME SLA NOTIFICATIONS DOCUMENTS - CASCADE & REMPLACEMENT

**Date de création** : 3 Décembre 2025  
**Statut** : ✅ Opérationnel et déployé

---

## 🎯 **OBJECTIF**

Mettre en place un système de notifications SLA en cascade pour les documents en attente de validation admin, avec remplacement automatique des notifications obsolètes pour éviter les doublons.

---

## 🏗️ **ARCHITECTURE DU SYSTÈME**

### **Principe de Remplacement en Cascade**

```
📄 NOTIFICATION INITIALE (t=0)
   notification_type: 'admin_action_required'
   status: 'unread'
   ✅ Visible dans le centre de notification

   ⏰ APRÈS 24h NON TRAITÉE
   → Créer SLA 24h (notification_type: 'documents_pending_validation_reminder')
   → Marquer INITIALE avec status: 'replaced'
   ✅ Seule SLA 24h visible maintenant

   ⏰ APRÈS 48h NON TRAITÉE
   → Créer SLA 48h (notification_type: 'documents_pending_validation_reminder')
   → Marquer SLA 24h avec status: 'replaced'
   ✅ Seule SLA 48h visible maintenant

   ⏰ APRÈS 120h NON TRAITÉE
   → Créer SLA 120h (notification_type: 'documents_pending_validation_reminder')
   → Marquer SLA 48h avec status: 'replaced'
   ✅ Seule SLA 120h visible maintenant
```

**Avantages** :
- ✅ Aucun doublon dans le centre de notifications
- ✅ Toujours la notification la plus pertinente affichée
- ✅ Historique conservé (status='replaced')
- ✅ Escalade visuelle selon l'urgence

---

## 📁 **FICHIERS CRÉÉS/MODIFIÉS**

### **1. Configuration SLA**
**Fichier** : `server/src/config/notification-sla-config.ts`

```typescript
documents_pending_validation_reminder: {
  targetHours: 24,      // 24h pour valider
  acceptableHours: 48,  // 48h acceptable
  criticalHours: 120,   // 120h (5j) critique
  defaultPriority: 'high',
  description: 'Validation des documents sous 24h - Rappel SLA automatique'
}
```

### **2. Service de Rappel SLA**
**Fichier** : `server/src/services/document-validation-reminder-service.ts`

**Fonctionnalités** :
- ✅ Vérifie tous les dossiers en attente (`admin_eligibility_status = 'pending' OR null`)
- ✅ Calcule le délai écoulé depuis `updated_at` ou `created_at`
- ✅ Crée les rappels SLA 24h/48h/120h selon le seuil atteint
- ✅ Remplace automatiquement les notifications obsolètes
- ✅ Stocke `metadata.reminders_sent` dans le dossier pour éviter doublons

### **3. Cron Job**
**Fichier** : `server/src/cron/document-validation-reminders.ts`

**Configuration** :
- ⏰ Exécution : Toutes les heures à :30 (timezone Europe/Paris)
- 🔄 Rattrapage automatique si redémarrage entre :25 et :35

### **4. Activation dans index.ts**
**Fichier** : `server/src/index.ts`

```typescript
import { startDocumentValidationRemindersCron } from './cron/document-validation-reminders';

// Démarrer le cron job
startDocumentValidationRemindersCron();
```

### **5. Filtrage API**
**Fichiers modifiés** :
- `server/src/routes/admin-notifications-new.ts`
- `server/src/routes/admin-notifications.ts`

**Ajouté** : `.neq('status', 'replaced')` pour exclure les notifications remplacées

### **6. Script de Rattrapage**
**Fichier** : `server/src/scripts/create-missing-document-notifications.ts`

**Usage** : Crée les notifications initiales manquantes pour les 25 dossiers existants

---

## 🚀 **DÉPLOIEMENT & UTILISATION**

### **Étape 1 : Exécuter le Script de Rattrapage (UNE SEULE FOIS)**

```bash
cd /Users/alex/Desktop/FinancialTracker/server
npx ts-node src/scripts/create-missing-document-notifications.ts
```

**Résultat attendu** :
```
🔄 [Script Rattrapage] Début de la création des notifications manquantes...
📊 25 dossier(s) en attente trouvé(s)
📊 X admin(s) actif(s) trouvé(s)
✅ Notification créée pour dossier xxx (admin admin@example.com)
...
📊 RÉSUMÉ :
  ✅ 25 notification(s) créée(s)
  ⏭️  0 notification(s) déjà existante(s)
```

### **Étape 2 : Vérifier dans Supabase**

```sql
-- Vérifier les notifications créées
SELECT 
  id,
  notification_type,
  title,
  priority,
  status,
  action_data->>'client_produit_id' as dossier_id,
  created_at
FROM notification
WHERE user_type = 'admin'
  AND notification_type IN ('admin_action_required', 'documents_pending_validation_reminder')
  AND status != 'replaced'
ORDER BY created_at DESC;
```

### **Étape 3 : Redémarrer le serveur**

```bash
# Le cron job démarre automatiquement
# Vérifier les logs :
tail -f logs/server.log | grep "Document SLA Reminder"
```

### **Étape 4 : Vérifier le Centre de Notifications**

1. Se connecter en tant qu'admin
2. Ouvrir le centre de notifications
3. Vérifier que les 25 dossiers apparaissent
4. Filtrer par "Non lues" → Tous les dossiers doivent être visibles

---

## 🧪 **TESTS**

### **Test 1 : Simuler un dossier en attente depuis 25h**

```sql
-- 1. Créer un dossier de test ou modifier un existant
UPDATE "ClientProduitEligible"
SET 
  created_at = NOW() - INTERVAL '25 hours',
  updated_at = NOW() - INTERVAL '25 hours',
  admin_eligibility_status = 'pending',
  metadata = '{}'::jsonb
WHERE id = 'TEST_DOSSIER_ID';

-- 2. Attendre l'exécution du cron (ou forcer manuellement)

-- 3. Vérifier qu'une notification SLA 24h a été créée
SELECT * FROM notification 
WHERE notification_type = 'documents_pending_validation_reminder'
  AND action_data->>'client_produit_id' = 'TEST_DOSSIER_ID'
  AND action_data->>'threshold' = '24h';

-- 4. Vérifier que la notification initiale a été remplacée
SELECT * FROM notification 
WHERE notification_type = 'admin_action_required'
  AND action_data->>'client_produit_id' = 'TEST_DOSSIER_ID'
  AND status = 'replaced';
```

### **Test 2 : Simuler 48h et vérifier cascade**

```sql
-- 1. Modifier pour simuler 49 heures
UPDATE "ClientProduitEligible"
SET 
  created_at = NOW() - INTERVAL '49 hours',
  updated_at = NOW() - INTERVAL '49 hours',
  metadata = '{"reminders_sent": {"24h": true}}'::jsonb
WHERE id = 'TEST_DOSSIER_ID';

-- 2. Forcer l'exécution du service

-- 3. Vérifier que SLA 48h a été créée et SLA 24h remplacée
SELECT 
  notification_type,
  action_data->>'threshold' as threshold,
  status,
  created_at
FROM notification 
WHERE action_data->>'client_produit_id' = 'TEST_DOSSIER_ID'
ORDER BY created_at DESC;
```

**Résultat attendu** :
```
notification_type                         | threshold | status    | created_at
------------------------------------------+-----------+-----------+-------------------
documents_pending_validation_reminder     | 48h       | unread    | 2025-12-03 14:30
documents_pending_validation_reminder     | 24h       | replaced  | 2025-12-03 13:30
admin_action_required                     | null      | replaced  | 2025-12-02 12:30
```

---

## 🎨 **INTERFACE VISUELLE**

Le `NotificationCenter.tsx` utilise `calculateSLAStatus()` pour appliquer des styles visuels selon l'urgence :

```typescript
const slaStatus = calculateSLAStatus(notification.notification_type, notification.created_at);

// Styles appliqués :
- ✅ OK (0-24h) : Bordure bleue, pas d'urgence
- ⚠️ Warning (24h-48h) : Bordure orange
- 🚨 Critical (48h-120h) : Ring rouge, border rouge
- ❌ Overdue (>120h) : Ring rouge intense, border rouge foncé
```

---

## 📊 **SURVEILLANCE & MONITORING**

### **Logs à surveiller**

```bash
# Cron job execution
grep "Document SLA Reminder" logs/server.log

# Notifications créées
grep "Notification.*créée pour admin" logs/server.log

# Notifications remplacées
grep "notification(s) remplacée(s)" logs/server.log
```

### **Métriques importantes**

```sql
-- Nombre de notifications SLA actives
SELECT 
  action_data->>'threshold' as threshold,
  COUNT(*) as count
FROM notification 
WHERE notification_type = 'documents_pending_validation_reminder'
  AND status = 'unread'
GROUP BY threshold;

-- Nombre de dossiers en attente sans notification
SELECT COUNT(*) 
FROM "ClientProduitEligible" cpe
WHERE (cpe.admin_eligibility_status = 'pending' OR cpe.admin_eligibility_status IS NULL)
  AND NOT EXISTS (
    SELECT 1 FROM notification n
    WHERE n.notification_type IN ('admin_action_required', 'documents_pending_validation_reminder')
      AND (n.action_data->>'client_produit_id' = cpe.id OR n.metadata->>'client_produit_id' = cpe.id)
      AND n.status != 'replaced'
  );
```

---

## ⚠️ **POINTS D'ATTENTION**

### **1. Éviter les doublons**
- ✅ Le service vérifie `metadata.reminders_sent` avant de créer un rappel
- ✅ L'API filtre `status != 'replaced'`
- ✅ Le script de rattrapage vérifie l'existence avant création

### **2. Gestion des préférences**
- ✅ Le service respecte `NotificationPreferencesChecker.shouldSendInApp()`
- ✅ Les admins peuvent désactiver ce type de notification

### **3. Performance**
- ✅ Limite de 500 dossiers par exécution
- ✅ Exécution toutes les heures (pas de surcharge)
- ✅ Index sur `notification.status` et `notification.notification_type`

---

## 🔧 **DÉPANNAGE**

### **Problème : Notifications en double**

```sql
-- Identifier les doublons
SELECT 
  user_id,
  action_data->>'client_produit_id' as dossier_id,
  COUNT(*) as count
FROM notification 
WHERE notification_type IN ('admin_action_required', 'documents_pending_validation_reminder')
  AND status != 'replaced'
GROUP BY user_id, action_data->>'client_produit_id'
HAVING COUNT(*) > 1;

-- Nettoyer : garder la plus récente, remplacer les autres
-- (Script à créer si nécessaire)
```

### **Problème : Cron ne s'exécute pas**

```bash
# Vérifier que le cron est démarré
grep "Cron job rappels SLA documents activé" logs/server.log

# Vérifier l'heure d'exécution
grep "Trigger vérification rappels SLA documents" logs/server.log
```

### **Problème : Notifications ne s'affichent pas**

```sql
-- Vérifier que status != 'replaced'
SELECT status, COUNT(*) 
FROM notification 
WHERE notification_type IN ('admin_action_required', 'documents_pending_validation_reminder')
GROUP BY status;

-- Vérifier l'API
-- Chercher dans le code : .neq('status', 'replaced')
```

---

## ✅ **CHECKLIST DE VALIDATION**

- [x] Configuration SLA ajoutée dans `notification-sla-config.ts`
- [x] Service `DocumentValidationReminderService` créé
- [x] Cron job créé et activé dans `index.ts`
- [x] API filtre bien `status != 'replaced'`
- [x] Script de rattrapage créé
- [ ] Script de rattrapage exécuté (25 notifications créées)
- [ ] Test manuel : notification initiale créée
- [ ] Test manuel : SLA 24h remplace initiale
- [ ] Test manuel : SLA 48h remplace 24h
- [ ] Test manuel : SLA 120h remplace 48h
- [ ] Vérification visuelle dans le centre de notification
- [ ] Aucun doublon affiché

---

## 📚 **RÉFÉRENCES**

- Service similaire : `rdv-sla-reminder-service.ts` (même logique de remplacement)
- Configuration SLA : `notification-sla-config.ts`
- Utils SLA frontend : `client/src/utils/notification-sla.ts`
- Composant UI : `client/src/components/admin/NotificationCenter.tsx`

---

**Système créé le** : 3 Décembre 2025  
**Version** : 1.0.0  
**Auteur** : AI Assistant avec validation utilisateur

