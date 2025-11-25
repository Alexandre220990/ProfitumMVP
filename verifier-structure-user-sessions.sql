-- ============================================================================
-- VÉRIFICATION DE LA STRUCTURE RÉELLE DE user_sessions
-- ============================================================================
-- Date : 2025-01-27
-- Objectif : Vérifier la structure exacte de user_sessions pour corriger
--            les scripts d'analyse
-- ============================================================================

-- Structure complète de user_sessions
SELECT 
    'STRUCTURE COMPLETE' as etape,
    column_name as colonne,
    data_type as type_donnees,
    character_maximum_length as longueur_max,
    is_nullable as nullable,
    column_default as valeur_par_defaut,
    ordinal_position as position
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_sessions'
ORDER BY ordinal_position;

-- Exemple de données (limité à 5 lignes)
-- Note: user_sessions n'a pas de colonnes refresh_token, ip_address, user_agent
SELECT 
    'EXEMPLE DONNEES' as etape,
    id,
    user_id,
    user_type,
    session_token,
    expires_at,
    last_activity,
    created_at,
    metadata
FROM user_sessions
LIMIT 5;

-- Vérifier les sessions actives (non expirées)
SELECT 
    'SESSIONS ACTIVES' as etape,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as sessions_actives,
    COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as sessions_expirees,
    COUNT(DISTINCT user_id) as nombre_utilisateurs_uniques
FROM user_sessions;

