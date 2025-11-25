-- ============================================================================
-- ANALYSE ADMIN - ÉTAPE 2B : TABLE AdminAuditLog (SYSTÈME DE TRACABILITÉ)
-- ============================================================================
-- Date : 2025-01-27
-- Objectif : Analyser la table AdminAuditLog qui est utilisée par la fonction
--            log_admin_action pour tracer toutes les actions des admins
-- ============================================================================

-- ============================================================================
-- 1. VÉRIFICATION DE L'EXISTENCE DE LA TABLE AdminAuditLog
-- ============================================================================

SELECT 
    'VERIFICATION AdminAuditLog' as analyse_etape,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'AdminAuditLog'
        ) THEN '✅ Table AdminAuditLog existe'
        ELSE '❌ Table AdminAuditLog n''existe pas (à créer)'
    END as statut;

-- ============================================================================
-- 2. STRUCTURE DE LA TABLE AdminAuditLog (SI ELLE EXISTE)
-- ============================================================================

-- Structure complète
SELECT 
    'STRUCTURE AdminAuditLog' as analyse_etape,
    column_name as colonne,
    data_type as type_donnees,
    character_maximum_length as longueur_max,
    is_nullable as nullable,
    column_default as valeur_par_defaut,
    ordinal_position as position
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'AdminAuditLog'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. CONTRAINTES ET INDEXES SUR AdminAuditLog
-- ============================================================================

-- Contraintes
SELECT 
    'CONTRAINTES AdminAuditLog' as analyse_etape,
    conname as nom_contrainte,
    CASE contype
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'c' THEN 'CHECK'
        ELSE contype::text
    END as type_contrainte,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = (
    SELECT oid FROM pg_class 
    WHERE relname = 'AdminAuditLog' 
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
)
ORDER BY contype, conname;

-- Indexes
SELECT 
    'INDEXES AdminAuditLog' as analyse_etape,
    indexname as nom_index,
    indexdef as definition_index
FROM pg_indexes
WHERE tablename = 'AdminAuditLog'
  AND schemaname = 'public'
ORDER BY indexname;

-- ============================================================================
-- 4. STATISTIQUES SUR LES ACTIONS LOGGÉES
-- ============================================================================

-- Nombre total d'actions loggées
SELECT 
    'STATISTIQUES AdminAuditLog' as analyse_etape,
    COUNT(*) as nombre_total_actions,
    COUNT(DISTINCT admin_id) as nombre_admins_uniques,
    COUNT(DISTINCT action) as nombre_types_actions,
    COUNT(DISTINCT table_name) as nombre_tables_modifiees,
    MIN(created_at) as premiere_action,
    MAX(created_at) as derniere_action
FROM "AdminAuditLog"
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'AdminAuditLog'
);

-- Actions par admin
SELECT 
    'ACTIONS PAR ADMIN' as analyse_etape,
    aal.admin_id,
    a.email as admin_email,
    a.name as admin_name,
    COUNT(*) as nombre_actions,
    COUNT(DISTINCT aal.action) as nombre_types_actions,
    COUNT(DISTINCT aal.table_name) as nombre_tables_modifiees,
    MAX(aal.created_at) as derniere_action
FROM "AdminAuditLog" aal
LEFT JOIN "Admin" a ON aal.admin_id = a.id
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'AdminAuditLog'
)
GROUP BY aal.admin_id, a.email, a.name
ORDER BY nombre_actions DESC;

-- ============================================================================
-- 5. ACTIONS RÉCENTES PAR TYPE
-- ============================================================================

-- Actions récentes (7 derniers jours) par type
SELECT 
    'ACTIONS RECENTES PAR TYPE' as analyse_etape,
    action,
    table_name,
    COUNT(*) as nombre_actions,
    COUNT(DISTINCT admin_id) as nombre_admins,
    MAX(created_at) as derniere_action
FROM "AdminAuditLog"
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'AdminAuditLog'
)
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY action, table_name
ORDER BY nombre_actions DESC
LIMIT 20;

-- ============================================================================
-- 6. VÉRIFICATION DE LA FONCTION log_admin_action
-- ============================================================================

-- Vérifier la définition de la fonction
SELECT 
    'FONCTION log_admin_action' as analyse_etape,
    proname as nom_fonction,
    pg_get_functiondef(oid) as definition_complete
FROM pg_proc
WHERE proname = 'log_admin_action'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ============================================================================
-- 7. VÉRIFICATION DES TRIGGERS UTILISANT AdminAuditLog
-- ============================================================================

-- Triggers qui utilisent log_admin_action
SELECT 
    'TRIGGERS AdminAuditLog' as analyse_etape,
    tgname as nom_trigger,
    tgrelid::regclass as table_cible,
    proname as fonction_appelee,
    CASE tgtype & 2
        WHEN 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END as timing,
    CASE tgtype & 4
        WHEN 4 THEN 'INSERT'
        WHEN 8 THEN 'DELETE'
        WHEN 16 THEN 'UPDATE'
        ELSE 'UNKNOWN'
    END as evenement
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE proname LIKE '%admin%audit%'
   OR proname = 'log_admin_action'
ORDER BY tgname;

-- ============================================================================
-- RÉSUMÉ DE L'ANALYSE
-- ============================================================================
-- Ce script analyse le système de traçabilité principal pour les admins :
-- 1. Vérification de l'existence de AdminAuditLog
-- 2. Structure complète de la table
-- 3. Contraintes et index pour optimiser les requêtes
-- 4. Statistiques sur les actions loggées
-- 5. Actions par admin (pour identifier qui fait quoi)
-- 6. Actions récentes par type
-- 7. Fonction log_admin_action et ses triggers
-- 
-- Cette table est CRUCIALE pour tracer toutes les actions des admins

