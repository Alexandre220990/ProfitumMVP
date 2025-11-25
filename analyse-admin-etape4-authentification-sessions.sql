-- ============================================================================
-- ANALYSE ADMIN - ÉTAPE 4 : AUTHENTIFICATION ET SESSIONS CONCURRENTES
-- ============================================================================
-- Date : 2025-01-27
-- Objectif : Analyser le système d'authentification et les sessions pour
--            comprendre comment gérer plusieurs admins connectés simultanément
-- ============================================================================

-- ============================================================================
-- 1. VÉRIFICATION DES TABLES DE SESSIONS
-- ============================================================================

-- Rechercher toutes les tables de session
SELECT 
    'TABLES SESSION' as analyse_etape,
    tablename as nom_table,
    rowsecurity as rls_actif,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.tablename) as nombre_colonnes
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename ILIKE '%session%'
ORDER BY tablename;

-- ============================================================================
-- 2. ANALYSE DE LA TABLE user_sessions
-- ============================================================================

-- Vérifier si la table existe
SELECT 
    'VERIFICATION user_sessions' as analyse_etape,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'user_sessions'
        ) THEN '✅ Table user_sessions existe'
        ELSE '❌ Table user_sessions n''existe pas'
    END as statut;

-- Structure de user_sessions (si elle existe)
SELECT 
    'STRUCTURE user_sessions' as analyse_etape,
    column_name as colonne,
    data_type as type_donnees,
    is_nullable as nullable,
    column_default as valeur_par_defaut
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_sessions'
ORDER BY ordinal_position;

-- Sessions actives actuellement (basées sur expires_at)
SELECT 
    'SESSIONS ACTIVES' as analyse_etape,
    COUNT(*) as nombre_total_sessions,
    COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as sessions_actives,
    COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as sessions_expirees,
    COUNT(DISTINCT user_id) as nombre_utilisateurs_uniques,
    MIN(created_at) as premiere_session,
    MAX(last_activity) as derniere_activite
FROM user_sessions
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_sessions'
);

-- ============================================================================
-- 3. VÉRIFICATION DES SESSIONS ADMIN ACTUELLES
-- ============================================================================

-- Sessions des admins dans user_sessions
-- Note: user_sessions.user_id est de type UUID (comme auth.users.id)
SELECT 
    'SESSIONS ADMIN' as analyse_etape,
    a.id as admin_id,
    a.email as admin_email,
    a.name as admin_name,
    COUNT(*) as nombre_sessions,
    COUNT(CASE WHEN us.expires_at > NOW() THEN 1 END) as sessions_actives,
    MAX(us.last_activity) as derniere_activite,
    MAX(us.created_at) as derniere_connexion
FROM user_sessions us
INNER JOIN auth.users au ON us.user_id = au.id
INNER JOIN "Admin" a ON a.auth_user_id = au.id
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_sessions'
)
GROUP BY a.id, a.email, a.name
ORDER BY derniere_activite DESC NULLS LAST;

-- Détails des sessions admin actives (non expirées)
-- Note: user_sessions.user_id est UUID (comme auth.users.id)
SELECT 
    'DETAILS SESSIONS ADMIN ACTIVES' as analyse_etape,
    us.id as session_id,
    a.email as admin_email,
    a.name as admin_name,
    us.user_id,
    us.user_type,
    us.session_token,
    us.created_at as session_creee,
    us.last_activity as derniere_activite,
    us.expires_at as expire_le,
    CASE 
        WHEN us.expires_at > NOW() THEN '✅ Active'
        ELSE '❌ Expirée'
    END as statut_session,
    us.metadata
FROM user_sessions us
INNER JOIN auth.users au ON us.user_id = au.id
INNER JOIN "Admin" a ON a.auth_user_id = au.id
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_sessions'
)
  AND us.expires_at > NOW()
ORDER BY us.last_activity DESC NULLS LAST;

-- ============================================================================
-- 4. VÉRIFICATION DE LA LIAISON auth.users <-> Admin
-- ============================================================================

-- Vérifier comment les admins sont liés à auth.users
SELECT 
    'LIAISON AUTH.USERS' as analyse_etape,
    a.id as admin_id,
    a.email as admin_email,
    a.name as admin_name,
    a.auth_user_id as auth_user_id_dans_admin,
    au.id as auth_user_id_verifie,
    au.email as auth_email,
    CASE 
        WHEN a.auth_user_id = au.id THEN '✅ Lié correctement'
        WHEN a.auth_user_id IS NULL THEN '⚠️ auth_user_id NULL dans Admin'
        WHEN au.id IS NULL THEN '❌ Utilisateur auth.users introuvable'
        ELSE '⚠️ Incohérence'
    END as statut_liaison,
    au.last_sign_in_at as derniere_connexion_auth,
    au.email_confirmed_at as email_confirme
FROM "Admin" a
LEFT JOIN auth.users au ON (a.auth_user_id = au.id OR a.email = au.email)
ORDER BY a.created_at DESC;

-- ============================================================================
-- 5. ANALYSE DES SESSIONS DANS auth.users (Supabase Auth)
-- ============================================================================

-- Sessions actives dans auth.users pour les admins
SELECT 
    'SESSIONS AUTH.USERS ADMIN' as analyse_etape,
    au.id as auth_user_id,
    au.email,
    a.id as admin_id,
    a.name as admin_name,
    au.last_sign_in_at,
    au.created_at as compte_cree,
    au.email_confirmed_at
FROM auth.users au
INNER JOIN "Admin" a ON (a.auth_user_id = au.id OR a.email = au.email)
ORDER BY au.last_sign_in_at DESC NULLS LAST;

-- ============================================================================
-- 6. VÉRIFICATION DES CONTRAINTES POUR SESSIONS CONCURRENTES
-- ============================================================================

-- Vérifier s'il existe des contraintes limitant les sessions simultanées
SELECT 
    'CONTRAINTES SESSIONS' as analyse_etape,
    conname as nom_contrainte,
    contype as type_contrainte,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid IN (
    SELECT oid FROM pg_class 
    WHERE relname = 'user_sessions' 
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
)
ORDER BY contype, conname;

-- Vérifier les index sur user_id dans user_sessions (pour performance sessions concurrentes)
SELECT 
    'INDEXES SESSIONS' as analyse_etape,
    indexname as nom_index,
    indexdef as definition
FROM pg_indexes
WHERE tablename = 'user_sessions'
  AND schemaname = 'public'
ORDER BY indexname;

-- ============================================================================
-- 7. VÉRIFICATION DES POLITIQUES RLS SUR user_sessions
-- ============================================================================

-- Politiques RLS sur user_sessions
SELECT 
    'RLS user_sessions' as analyse_etape,
    policyname as nom_politique,
    permissive,
    roles as roles_concernes,
    cmd as commande_sql,
    qual as condition_where
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'user_sessions'
ORDER BY policyname;

-- ============================================================================
-- 8. TEST DE COMPATIBILITÉ SESSIONS CONCURRENTES
-- ============================================================================

-- Compter les sessions actives simultanées par admin
-- Note: user_sessions.user_id est TEXT, auth.users.id est UUID
SELECT 
    'TEST CONCURRENT' as analyse_etape,
    a.id as admin_id,
    a.email,
    COUNT(us.id) as nombre_sessions_actives,
    CASE 
        WHEN COUNT(us.id) > 1 THEN '✅ Plusieurs sessions simultanées possibles'
        WHEN COUNT(us.id) = 1 THEN '✅ Une session active'
        ELSE 'Aucune session active'
    END as statut_concurrent
FROM "Admin" a
LEFT JOIN auth.users au ON a.auth_user_id = au.id
LEFT JOIN user_sessions us ON us.user_id = au.id AND us.expires_at > NOW()
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_sessions'
)
GROUP BY a.id, a.email
HAVING COUNT(us.id) > 0;

-- ============================================================================
-- 9. VÉRIFICATION DU SYSTÈME JWT (informations dans le code)
-- ============================================================================

-- Note : Le système JWT est géré côté application, pas directement en BDD
-- Ce script vérifie les sessions stockées en BDD

SELECT 
    'INFO JWT' as analyse_etape,
    'Le système JWT stocke : id (auth_user_id), email, type (admin), database_id (Admin.id)' as info_jwt,
    'Les sessions sont gérées dans user_sessions avec session_token' as info_sessions,
    'Plusieurs admins peuvent se connecter simultanément car chaque session est indépendante' as conclusion;

-- ============================================================================
-- RÉSUMÉ DE L'ANALYSE
-- ============================================================================
-- Après exécution de ce script, vous aurez :
-- 1. Liste de toutes les tables de session
-- 2. Structure et statistiques de user_sessions
-- 3. Sessions admin actuelles (actives et inactives)
-- 4. Liaison entre Admin et auth.users
-- 5. Sessions dans auth.users pour les admins
-- 6. Contraintes et index sur les sessions
-- 7. Politiques RLS sur user_sessions
-- 8. Test de compatibilité pour sessions concurrentes
-- 
-- Prochaine étape : Analyse des routes et middlewares d'authentification admin

