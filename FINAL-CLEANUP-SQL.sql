-- ============================================================================
-- 🧹 NETTOYAGE FINAL - SUPPRIMER 'role' COMPLÈTEMENT
-- ============================================================================
-- À exécuter dans Supabase SQL Editor APRÈS COPIER-COLLER-SUPABASE.sql
-- ============================================================================

-- 1️⃣ AVANT: Vérifier l'état actuel
SELECT 
    email,
    raw_user_meta_data->>'type' as type,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'first_name' as first_name,
    raw_user_meta_data->>'last_name' as last_name
FROM auth.users
WHERE email IS NOT NULL
ORDER BY email
LIMIT 20;

-- 2️⃣ SUPPRIMER le champ 'role' (redondant avec 'type')
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE raw_user_meta_data ? 'role';

-- 3️⃣ APRÈS: Vérifier que 'type' existe toujours et 'role' est supprimé
SELECT 
    email,
    raw_user_meta_data->>'type' as type,
    raw_user_meta_data->>'role' as role_should_be_null,
    CASE 
        WHEN raw_user_meta_data->>'type' IS NOT NULL THEN '✅'
        ELSE '❌ TYPE MANQUANT'
    END as status_type,
    CASE 
        WHEN raw_user_meta_data ? 'role' THEN '⚠️ Role encore présent'
        ELSE '✅'
    END as status_role
FROM auth.users
WHERE email IS NOT NULL
ORDER BY email
LIMIT 20;

-- 4️⃣ STATISTIQUES FINALES
SELECT 
    '✅ NETTOYAGE TERMINÉ' as message,
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE raw_user_meta_data->>'type' = 'client') as clients,
    COUNT(*) FILTER (WHERE raw_user_meta_data->>'type' = 'expert') as experts,
    COUNT(*) FILTER (WHERE raw_user_meta_data->>'type' = 'admin') as admins,
    COUNT(*) FILTER (WHERE raw_user_meta_data->>'type' = 'apporteur') as apporteurs,
    COUNT(*) FILTER (WHERE raw_user_meta_data ? 'role') as avec_role_restant
FROM auth.users;

-- ✅ Le champ 'avec_role_restant' doit être 0

