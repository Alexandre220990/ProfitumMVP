-- ============================================================================
-- ANALYSE ADMIN - ÉTAPE 5 : ACTIONS CRITIQUES ET TRACABILITÉ
-- ============================================================================
-- Date : 2025-01-27
-- Objectif : Identifier les actions critiques nécessitant un tracking par admin_id
--            pour suivre qui fait quoi, notamment pour les actions urgentes
-- ============================================================================

-- ============================================================================
-- 1. RECHERCHE DES TABLES AVEC COLONNES handled_by, created_by, modified_by
-- ============================================================================

-- Ces colonnes indiquent souvent où le tracking est déjà implémenté ou nécessaire
SELECT 
    'COLONNES TRACKING' as analyse_etape,
    table_name as nom_table,
    column_name as colonne,
    data_type as type_donnees,
    is_nullable as nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
      column_name ILIKE '%handled_by%'
      OR column_name ILIKE '%created_by%'
      OR column_name ILIKE '%modified_by%'
      OR column_name ILIKE '%updated_by%'
      OR column_name ILIKE '%assigned_by%'
      OR column_name ILIKE '%processed_by%'
      OR column_name ILIKE '%validated_by%'
      OR column_name ILIKE '%approved_by%'
      OR column_name ILIKE '%admin_id%'
  )
ORDER BY table_name, column_name;

-- ============================================================================
-- 2. ANALYSE DES NOTIFICATIONS ADMIN (actions urgentes)
-- ============================================================================

-- Structure de AdminNotification
SELECT 
    'NOTIFICATIONS STRUCTURE' as analyse_etape,
    column_name as colonne,
    data_type as type_donnees,
    is_nullable as nullable,
    column_default as valeur_par_defaut
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'AdminNotification'
ORDER BY ordinal_position;

-- Statistiques sur les notifications traitées par admin
SELECT 
    'NOTIFICATIONS TRAITEES' as analyse_etape,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN handled_by IS NOT NULL THEN 1 END) as notifications_traitees,
    COUNT(DISTINCT handled_by) as nombre_admins_ayant_traite,
    COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as notifications_urgentes,
    COUNT(CASE WHEN priority = 'urgent' AND handled_by IS NOT NULL THEN 1 END) as urgentes_traitees
FROM "AdminNotification"
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'AdminNotification'
);

-- Détails des notifications urgentes non traitées
SELECT 
    'NOTIFICATIONS URGENTES NON TRAITEES' as analyse_etape,
    id,
    type,
    title,
    message,
    priority,
    status,
    handled_by,
    created_at,
    CASE 
        WHEN handled_by IS NULL THEN '❌ Non traitée'
        ELSE '✅ Traitée'
    END as statut
FROM "AdminNotification"
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'AdminNotification'
)
  AND priority = 'urgent'
  AND status != 'resolved'
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- 3. ANALYSE DES VALIDATIONS ET APPROBATIONS
-- ============================================================================

-- Rechercher les tables liées aux validations
SELECT 
    'TABLES VALIDATION' as analyse_etape,
    tablename as nom_table,
    rowsecurity as rls_actif
FROM pg_tables
WHERE schemaname = 'public'
  AND (
      tablename ILIKE '%validation%'
      OR tablename ILIKE '%approval%'
      OR tablename ILIKE '%approbation%'
  )
ORDER BY tablename;

-- Vérifier les colonnes de validation dans ClientProduitEligible (dossiers)
SELECT 
    'VALIDATIONS DOSSIERS' as analyse_etape,
    column_name as colonne,
    data_type as type_donnees,
    is_nullable as nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ClientProduitEligible'
  AND (
      column_name ILIKE '%valid%'
      OR column_name ILIKE '%approv%'
      OR column_name ILIKE '%admin%'
      OR column_name ILIKE '%handled%'
  )
ORDER BY column_name;

-- ============================================================================
-- 4. ANALYSE DES MODIFICATIONS DE STATUT (actions critiques)
-- ============================================================================

-- Vérifier DossierHistorique pour les actions de changement de statut
SELECT 
    'ACTIONS CHANGEMENT STATUT' as analyse_etape,
    action_type,
    user_type,
    COUNT(*) as nombre_actions,
    COUNT(DISTINCT user_id) as nombre_admins,
    COUNT(DISTINCT dossier_id) as nombre_dossiers_concernes,
    MIN(created_at) as premiere_action,
    MAX(created_at) as derniere_action
FROM "DossierHistorique"
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'DossierHistorique'
)
  AND user_type = 'admin'
  AND action_type LIKE '%statut%'
GROUP BY action_type, user_type
ORDER BY nombre_actions DESC;

-- Actions récentes par admin
SELECT 
    'ACTIONS RECENTES PAR ADMIN' as analyse_etape,
    user_id,
    user_name,
    action_type,
    COUNT(*) as nombre_actions,
    MAX(created_at) as derniere_action
FROM "DossierHistorique"
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'DossierHistorique'
)
  AND user_type = 'admin'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY user_id, user_name, action_type
ORDER BY derniere_action DESC;

-- ============================================================================
-- 5. RECHERCHE DES TABLES SANS TRACKING ADMIN
-- ============================================================================

-- Tables importantes qui pourraient nécessiter un tracking admin
SELECT 
    'TABLES SANS TRACKING' as analyse_etape,
    tablename as nom_table,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = t.tablename 
            AND column_name IN ('handled_by', 'created_by', 'modified_by', 'admin_id')
        ) THEN '✅ A du tracking'
        ELSE '⚠️ Pas de tracking admin'
    END as statut_tracking
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN (
      'AdminNotification',
      'ClientProduitEligible',
      'Document',
      'Validation',
      'Expert',
      'Client',
      'Apporteur'
  )
ORDER BY tablename;

-- ============================================================================
-- 6. ANALYSE DES ACTIONS DANS LES LOGS D'AUDIT
-- ============================================================================

-- Actions admin récentes dans audit_logs
SELECT 
    'ACTIONS AUDIT audit_logs' as analyse_etape,
    category,
    level,
    COUNT(*) as nombre_actions,
    COUNT(DISTINCT user_id) as nombre_admins,
    MAX(created_at) as derniere_action
FROM audit_logs
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'audit_logs'
)
  AND user_id IN (SELECT id FROM "Admin")
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY category, level
ORDER BY nombre_actions DESC;

-- Actions admin récentes dans AuditLog
SELECT 
    'ACTIONS AUDIT AuditLog' as analyse_etape,
    action,
    resource_type,
    COUNT(*) as nombre_actions,
    COUNT(DISTINCT user_id) as nombre_admins,
    COUNT(CASE WHEN success = true THEN 1 END) as reussies,
    COUNT(CASE WHEN success = false THEN 1 END) as echouees,
    MAX(timestamp) as derniere_action
FROM "AuditLog"
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'AuditLog'
)
  AND user_id IN (SELECT id FROM "Admin")
  AND timestamp > NOW() - INTERVAL '7 days'
GROUP BY action, resource_type
ORDER BY nombre_actions DESC
LIMIT 20;

-- ============================================================================
-- 7. IDENTIFICATION DES ACTIONS URGENTES NÉCESSITANT UN TRACKING
-- ============================================================================

-- Liste des actions critiques à tracker
SELECT 
    'ACTIONS CRITIQUES A TRACKER' as analyse_etape,
    'Changement de statut de dossier' as action,
    'ClientProduitEligible' as table_principale,
    'DossierHistorique' as table_audit,
    '✅ Déjà tracé via user_id dans DossierHistorique' as statut
UNION ALL
SELECT 
    'ACTIONS CRITIQUES A TRACKER',
    'Traitement de notification urgente',
    'AdminNotification',
    'AdminNotification.handled_by',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'AdminNotification' AND column_name = 'handled_by'
        ) THEN '✅ Déjà tracé via handled_by'
        ELSE '❌ À ajouter handled_by'
    END
UNION ALL
SELECT 
    'ACTIONS CRITIQUES A TRACKER',
    'Validation/Approbation de dossier',
    'ClientProduitEligible',
    'DossierHistorique ou AuditLog',
    '✅ Déjà tracé via DossierHistorique'
UNION ALL
SELECT 
    'ACTIONS CRITIQUES A TRACKER',
    'Modification de données sensibles',
    'Toutes tables critiques',
    'AuditLog ou audit_logs',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'AuditLog'
        ) THEN '✅ Déjà tracé via AuditLog.user_id'
        ELSE '⚠️ À vérifier'
    END;

-- ============================================================================
-- RÉSUMÉ DE L'ANALYSE
-- ============================================================================
-- Après exécution de ce script, vous aurez :
-- 1. Liste des colonnes de tracking existantes (handled_by, created_by, etc.)
-- 2. Analyse des notifications admin et leur traitement
-- 3. Identification des validations et approbations
-- 4. Analyse des changements de statut (actions critiques)
-- 5. Liste des tables sans tracking admin
-- 6. Analyse des actions dans les logs d'audit
-- 7. Identification des actions urgentes nécessitant un tracking
-- 
-- PROCHAINE ÉTAPE : Proposer la solution complète pour ajouter un second admin
--                   avec traçabilité complète de toutes les actions

