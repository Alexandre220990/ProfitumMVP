# Guide de Fusion des Tables Notification

## 📋 Vue d'ensemble

Ce guide vous permet de fusionner les tables `notification` (minuscule) et `Notification` (majuscule) en une seule table unifiée `Notification` (majuscule) sans perdre de données.

## 🎯 Objectifs

1. **Préserver toutes les données** des deux tables
2. **Unifier la structure** avec la colonne `user_id`
3. **Maintenir les politiques RLS** existantes
4. **Corriger les erreurs** du service client

## 📁 Fichiers créés

- `merge-notification-tables.sql` - Script de fusion principal
- `test-notification-merge.js` - Script de test
- `GUIDE-FUSION-NOTIFICATIONS.md` - Ce guide

## 🚀 Étapes d'exécution

### Étape 1: Sauvegarde (Recommandé)

Avant d'exécuter la fusion, faites une sauvegarde de vos données :

```sql
-- Sauvegarde de la table notification (minuscule)
CREATE TABLE notification_backup AS SELECT * FROM notification;

-- Sauvegarde de la table Notification (majuscule)
CREATE TABLE "Notification_backup" AS SELECT * FROM "Notification";
```

### Étape 2: Exécution de la fusion

1. **Connectez-vous à votre dashboard Supabase**
2. **Allez dans l'éditeur SQL**
3. **Copiez et collez le contenu du fichier `merge-notification-tables.sql`**
4. **Exécutez le script**

### Étape 3: Vérification

Après l'exécution, vérifiez que :

```sql
-- Vérifier que la table Notification existe
SELECT COUNT(*) FROM "Notification";

-- Vérifier la structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Notification' 
ORDER BY ordinal_position;

-- Vérifier les politiques RLS
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'Notification';
```

### Étape 4: Test

Exécutez le script de test :

```bash
node test-notification-merge.js
```

## 🔧 Détails techniques

### Structure finale de la table Notification

```sql
CREATE TABLE public."Notification" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'expert', 'admin')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    action_data JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_dismissed BOOLEAN DEFAULT false,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Politiques RLS configurées

1. **Users can view their own notifications** - Les utilisateurs voient leurs propres notifications
2. **Users can manage their own notifications** - Les utilisateurs gèrent leurs propres notifications
3. **Admins can view all notifications** - Les admins voient toutes les notifications

### Index créés

- `idx_notification_user_id` - Index sur user_id
- `idx_notification_user_type` - Index sur user_type
- `idx_notification_type` - Index sur notification_type
- `idx_notification_is_read` - Index sur is_read
- `idx_notification_priority` - Index sur priority
- `idx_notification_created_at` - Index sur created_at
- `idx_notification_expires_at` - Index sur expires_at
- `idx_notification_is_dismissed` - Index sur is_dismissed

## 🧪 Types de notifications supportés

### Types génériques
- `assignment`, `message`, `reminder`, `alert`, `promotion`, `system`

### Types spécifiques clients
- `document_uploaded`, `document_required`, `document_approved`, `document_rejected`, `document_expiring`

### Types spécifiques dossiers
- `dossier_accepted`, `dossier_rejected`, `dossier_step_completed`, `dossier_audit_completed`

### Types spécifiques messages
- `message_received`, `message_urgent`, `message_response`

### Types spécifiques rappels
- `deadline_reminder`, `payment_reminder`, `validation_reminder`

## ⚠️ Points d'attention

1. **Sauvegarde** : Toujours faire une sauvegarde avant la fusion
2. **Downtime** : La fusion peut prendre quelques secondes
3. **Permissions** : Assurez-vous d'avoir les droits d'administration
4. **Test** : Testez toujours après la fusion

## 🔄 Rollback (si nécessaire)

Si vous devez annuler la fusion :

```sql
-- Restaurer les tables originales
DROP TABLE IF EXISTS "Notification";
ALTER TABLE notification_backup RENAME TO notification;
ALTER TABLE "Notification_backup" RENAME TO "Notification";
```

## 📞 Support

En cas de problème :
1. Vérifiez les logs d'erreur dans Supabase
2. Testez avec le script de test
3. Vérifiez les politiques RLS
4. Contactez l'équipe de développement

## ✅ Checklist de validation

- [ ] Sauvegarde effectuée
- [ ] Script de fusion exécuté
- [ ] Table Notification accessible
- [ ] Politiques RLS configurées
- [ ] Index créés
- [ ] Tests passés
- [ ] Service client fonctionne
- [ ] Anciennes tables supprimées

---

**Date de création :** 2025-01-03  
**Version :** 1.0  
**Auteur :** Assistant IA 