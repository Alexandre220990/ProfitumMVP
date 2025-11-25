-- ============================================================================
-- ANALYSE ADMIN - ÉTAPE 3 : SYSTÈMES D'AUDIT ET DE TRACABILITÉ
-- ============================================================================
-- Date : 2025-01-27
-- Objectif : Analyser tous les systèmes d'audit existants pour comprendre
--            comment les actions sont actuellement enregistrées et identifier
--            où ajouter le tracking par admin_id
-- ============================================================================

-- ============================================================================
-- 1. RECHERCHE DE TOUTES LES TABLES D'AUDIT/HISTORIQUE
-- ============================================================================

SELECT 
    'TABLES AUDIT' as analyse_etape,
    tablename as nom_table,
    rowsecurity as rls_actif,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.tablename) as nombre_colonnes
FROM pg_tables t
WHERE schemaname = 'public'
  AND (
      tablename ILIKE '%audit%' 
      OR tablename ILIKE '%log%' 
      OR tablename ILIKE '%historique%'
      OR tablename ILIKE '%history%'
      OR tablename ILIKE '%trace%'
      OR tablename ILIKE '%track%'
      OR tablename ILIKE '%activity%'
  )
ORDER BY tablename;

-- ============================================================================
-- 2. ANALYSE DE LA TABLE audit_logs
-- ============================================================================

-- Vérifier si la table existe
SELECT 
    'VERIFICATION audit_logs' as analyse_etape,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'audit_logs'
        ) THEN '✅ Table audit_logs existe'
        ELSE '❌ Table audit_logs n''existe pas'
    END as statut;

-- Structure de audit_logs (si elle existe)
SELECT 
    'STRUCTURE audit_logs' as analyse_etape,
    column_name as colonne,
    data_type as type_donnees,
    is_nullable as nullable,
    column_default as valeur_par_defaut
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'audit_logs'
ORDER BY ordinal_position;

-- Statistiques sur audit_logs
SELECT 
    'STATISTIQUES audit_logs' as analyse_etape,
    COUNT(*) as nombre_total_logs,
    COUNT(DISTINCT user_id) as nombre_utilisateurs_uniques,
    COUNT(DISTINCT category) as nombre_categories,
    MIN(created_at) as premier_log,
    MAX(created_at) as dernier_log,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as logs_avec_user_id,
    COUNT(CASE WHEN user_email IS NOT NULL THEN 1 END) as logs_avec_email
FROM audit_logs
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'audit_logs'
);

-- ============================================================================
-- 3. ANALYSE DE LA TABLE AuditLog
-- ============================================================================

-- Vérifier si la table existe
SELECT 
    'VERIFICATION AuditLog' as analyse_etape,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'AuditLog'
        ) THEN '✅ Table AuditLog existe'
        ELSE '❌ Table AuditLog n''existe pas'
    END as statut;

-- Structure de AuditLog (si elle existe)
SELECT 
    'STRUCTURE AuditLog' as analyse_etape,
    column_name as colonne,
    data_type as type_donnees,
    is_nullable as nullable,
    column_default as valeur_par_defaut
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'AuditLog'
ORDER BY ordinal_position;

-- Statistiques sur AuditLog (si elle existe)
-- Utiliser une fonction pour éviter l'erreur si la table n'existe pas
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'AuditLog'
    ) THEN
        RAISE NOTICE 'Table AuditLog existe - Affichage des statistiques';
        -- Les statistiques seront affichées dans la requête suivante
    ELSE
        RAISE NOTICE 'Table AuditLog n''existe pas - Statistiques non disponibles';
    END IF;
END $$;

-- Cette requête ne s'exécutera que si la table existe (via le DO block ci-dessus)
-- Si la table n'existe pas, cette requête retournera une erreur mais c'est attendu
-- Pour éviter l'erreur, on peut utiliser une fonction ou simplement commenter cette section
-- car nous savons déjà que la table n'existe pas d'après l'analyse précédente
/*
SELECT 
    'STATISTIQUES AuditLog' as analyse_etape,
    COUNT(*) as nombre_total_logs,
    COUNT(DISTINCT user_id) as nombre_utilisateurs_uniques,
    COUNT(DISTINCT action) as nombre_actions_diff,
    MIN(timestamp) as premier_log,
    MAX(timestamp) as dernier_log,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as logs_avec_user_id
FROM "AuditLog";
*/

-- ============================================================================
-- 4. ANALYSE DE LA TABLE DossierHistorique
-- ============================================================================

-- Vérifier si la table existe
SELECT 
    'VERIFICATION DossierHistorique' as analyse_etape,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'DossierHistorique'
        ) THEN '✅ Table DossierHistorique existe'
        ELSE '❌ Table DossierHistorique n''existe pas'
    END as statut;

-- Structure de DossierHistorique (si elle existe)
SELECT 
    'STRUCTURE DossierHistorique' as analyse_etape,
    column_name as colonne,
    data_type as type_donnees,
    is_nullable as nullable,
    column_default as valeur_par_defaut
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'DossierHistorique'
ORDER BY ordinal_position;

-- Vérifier comment les admins sont identifiés dans DossierHistorique
SELECT 
    'ADMINS DANS DossierHistorique' as analyse_etape,
    user_type,
    COUNT(*) as nombre_actions,
    COUNT(DISTINCT user_id) as nombre_admins_uniques,
    COUNT(DISTINCT action_type) as nombre_types_actions
FROM "DossierHistorique"
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'DossierHistorique'
)
  AND user_type = 'admin'
GROUP BY user_type;

-- ============================================================================
-- 5. RECHERCHE DE COLONNES IDENTIFIANT LES ADMINS DANS LES TABLES D'AUDIT
-- ============================================================================

-- Rechercher toutes les colonnes pouvant identifier un admin dans les tables d'audit
SELECT DISTINCT
    'COLONNES IDENTIFIANT ADMINS' as analyse_etape,
    table_name as nom_table,
    column_name as colonne,
    data_type as type_donnees
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
      column_name ILIKE '%user_id%'
      OR column_name ILIKE '%admin_id%'
      OR column_name ILIKE '%created_by%'
      OR column_name ILIKE '%modified_by%'
      OR column_name ILIKE '%handled_by%'
      OR column_name ILIKE '%performed_by%'
      OR column_name ILIKE '%actor_id%'
      OR column_name ILIKE '%author_id%'
  )
  AND table_name IN (
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND (
          tablename ILIKE '%audit%' 
          OR tablename ILIKE '%log%' 
          OR tablename ILIKE '%historique%'
          OR tablename ILIKE '%history%'
      )
  )
ORDER BY table_name, column_name;

-- ============================================================================
-- 6. ANALYSE DES ACTIONS ADMIN DANS LES LOGS EXISTANTS
-- ============================================================================

-- Actions effectuées par des admins dans audit_logs
SELECT 
    'ACTIONS ADMIN audit_logs' as analyse_etape,
    category,
    level,
    COUNT(*) as nombre_actions,
    COUNT(DISTINCT user_id) as nombre_admins
FROM audit_logs
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'audit_logs'
)
  AND user_id IN (SELECT id FROM "Admin")
GROUP BY category, level
ORDER BY nombre_actions DESC;

-- Actions effectuées par des admins dans AuditLog (si la table existe)
-- Note: Cette section est commentée car la table AuditLog n'existe pas
-- Si vous créez cette table plus tard, décommentez cette section
/*
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'AuditLog'
    ) THEN
        -- Exécuter la requête seulement si la table existe
        PERFORM * FROM "AuditLog" LIMIT 1;
    ELSE
        RAISE NOTICE 'Table AuditLog n''existe pas - Actions non disponibles';
    END IF;
END $$;

SELECT 
    'ACTIONS ADMIN AuditLog' as analyse_etape,
    action,
    resource_type,
    COUNT(*) as nombre_actions,
    COUNT(DISTINCT user_id) as nombre_admins,
    COUNT(CASE WHEN success = true THEN 1 END) as actions_reussies,
    COUNT(CASE WHEN success = false THEN 1 END) as actions_echouees
FROM "AuditLog"
WHERE user_id IN (SELECT id FROM "Admin")
GROUP BY action, resource_type
ORDER BY nombre_actions DESC
LIMIT 20;
*/

-- ============================================================================
-- 7. VÉRIFICATION DES TABLES LIÉES AUX NOTIFICATIONS ADMIN
-- ============================================================================

-- Vérifier la table AdminNotification et sa colonne handled_by
SELECT 
    'NOTIFICATIONS ADMIN' as analyse_etape,
    column_name as colonne,
    data_type as type_donnees,
    is_nullable as nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'AdminNotification'
  AND column_name IN ('handled_by', 'created_by', 'user_id')
ORDER BY ordinal_position;

-- Statistiques sur les notifications traitées
SELECT 
    'NOTIFICATIONS TRAITEES' as analyse_etape,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN handled_by IS NOT NULL THEN 1 END) as notifications_traitees,
    COUNT(DISTINCT handled_by) as nombre_admins_ayant_traite
FROM "AdminNotification"
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'AdminNotification'
);

-- ============================================================================
-- RÉSUMÉ DE L'ANALYSE
-- ============================================================================
-- Après exécution de ce script, vous aurez :
-- 1. Liste de toutes les tables d'audit/historique existantes
-- 2. Structure et statistiques de audit_logs
-- 3. Structure et statistiques de AuditLog
-- 4. Structure et utilisation de DossierHistorique
-- 5. Identification des colonnes pouvant identifier les admins
-- 6. Analyse des actions admin dans les logs existants
-- 7. Vérification du système de notifications admin
-- 
-- Prochaine étape : Analyse de l'authentification et des sessions concurrentes

