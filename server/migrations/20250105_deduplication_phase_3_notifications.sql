-- =====================================================
-- DÉDOUBLONNAGE PHASE 3 : Tables de Notifications
-- Date : 2025-01-05
-- Objectif : Fusionner les tables de notifications en minuscules vers les tables en majuscules
-- =====================================================

-- ===== 1. SAUVEGARDE DES DONNÉES =====
BEGIN;

-- Créer des sauvegardes temporaires
CREATE TEMP TABLE temp_notification_backup AS 
SELECT * FROM notification WHERE id NOT IN (SELECT id FROM "Notification");

CREATE TEMP TABLE temp_notification_backup_2 AS 
SELECT * FROM notification_backup WHERE id NOT IN (SELECT id FROM "Notification_backup");

-- ===== 2. ANALYSE DES DONNÉES =====

-- Vérifier la structure et le contenu des tables
SELECT 
    'notification' as table_name,
    COUNT(*) as record_count,
    'Principale' as status
FROM notification
UNION ALL
SELECT 
    'Notification' as table_name,
    COUNT(*) as record_count,
    'Doublon' as status
FROM "Notification"
UNION ALL
SELECT 
    'notification_backup' as table_name,
    COUNT(*) as record_count,
    'Backup' as status
FROM notification_backup
UNION ALL
SELECT 
    'Notification_backup' as table_name,
    COUNT(*) as record_count,
    'Backup Doublon' as status
FROM "Notification_backup"
UNION ALL
SELECT 
    'notification_final' as table_name,
    COUNT(*) as record_count,
    'Finale' as status
FROM notification_final;

-- ===== 3. STRATÉGIE DE FUSION =====

-- Décision : Garder 'notification' comme table principale (plus de données)
-- Fusionner les données uniques des autres tables vers 'notification'

-- Fusion des données de 'Notification' vers 'notification'
INSERT INTO notification 
SELECT * FROM "Notification" 
WHERE id NOT IN (SELECT id FROM notification)
ON CONFLICT (id) DO NOTHING;

-- Fusion des données de 'notification_backup' vers 'notification'
INSERT INTO notification 
SELECT * FROM notification_backup 
WHERE id NOT IN (SELECT id FROM notification)
ON CONFLICT (id) DO NOTHING;

-- Fusion des données de 'Notification_backup' vers 'notification'
INSERT INTO notification 
SELECT * FROM "Notification_backup" 
WHERE id NOT IN (SELECT id FROM notification)
ON CONFLICT (id) DO NOTHING;

-- Fusion des données de 'notification_final' vers 'notification'
INSERT INTO notification 
SELECT * FROM notification_final 
WHERE id NOT IN (SELECT id FROM notification)
ON CONFLICT (id) DO NOTHING;

-- ===== 4. VÉRIFICATION DES DONNÉES MIGRÉES =====

-- Compter les enregistrements migrés
SELECT 
    'Fusion Notification' as operation,
    COUNT(*) as migrated_records
FROM "Notification" 
WHERE id IN (SELECT id FROM notification)
UNION ALL
SELECT 
    'Fusion notification_backup' as operation,
    COUNT(*) as migrated_records
FROM notification_backup 
WHERE id IN (SELECT id FROM notification)
UNION ALL
SELECT 
    'Fusion Notification_backup' as operation,
    COUNT(*) as migrated_records
FROM "Notification_backup" 
WHERE id IN (SELECT id FROM notification)
UNION ALL
SELECT 
    'Fusion notification_final' as operation,
    COUNT(*) as migrated_records
FROM notification_final 
WHERE id IN (SELECT id FROM notification);

-- ===== 5. SUPPRESSION DES TABLES EN DOUBLON =====

-- Supprimer les tables en doublon après vérification
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS notification_backup CASCADE;
DROP TABLE IF EXISTS "Notification_backup" CASCADE;
DROP TABLE IF EXISTS notification_final CASCADE;

-- ===== 6. VÉRIFICATION FINALE =====

-- Vérifier que seule la table 'notification' existe
SELECT 
    table_name,
    'Notifications' as category,
    COUNT(*) as final_record_count
FROM information_schema.tables 
JOIN notification ON true
WHERE table_schema = 'public' 
AND table_name = 'notification'
GROUP BY table_name;

COMMIT;

-- ===== 7. RAPPORT DE MIGRATION =====
DO $$
DECLARE
    final_count INTEGER := 0;
BEGIN
    -- Compter les enregistrements finaux
    SELECT COUNT(*) INTO final_count FROM notification;
    
    RAISE NOTICE '✅ Migration Phase 3 Notifications terminée: % enregistrements dans la table finale', final_count;
END $$; 