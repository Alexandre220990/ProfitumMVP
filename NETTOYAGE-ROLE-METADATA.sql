-- ============================================================================
-- NETTOYAGE: Suppression du champ 'role' redondant
-- ============================================================================
-- Le champ 'type' est suffisant, 'role' est une redondance
-- ============================================================================

-- 1️⃣ VÉRIFICATION AVANT: Voir qui a un 'role'
SELECT 
    email,
    raw_user_meta_data->>'type' as type,
    raw_user_meta_data->>'role' as role,
    CASE 
        WHEN raw_user_meta_data->>'type' = raw_user_meta_data->>'role' THEN '✅ Identique'
        WHEN raw_user_meta_data->>'role' IS NULL THEN '⚠️ Role absent'
        ELSE '❌ Différent'
    END as comparaison
FROM auth.users
WHERE raw_user_meta_data ? 'role' OR raw_user_meta_data ? 'type';

-- 2️⃣ SUPPRESSION du champ 'role' (car redondant avec 'type')
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE raw_user_meta_data ? 'role';

-- 3️⃣ VÉRIFICATION APRÈS: S'assurer que 'type' existe toujours
SELECT 
    email,
    raw_user_meta_data->>'type' as type,
    raw_user_meta_data->>'role' as role,
    CASE 
        WHEN raw_user_meta_data->>'type' IS NOT NULL THEN '✅ Type présent'
        ELSE '❌ Type manquant'
    END as verification
FROM auth.users
WHERE email IS NOT NULL
ORDER BY email;

-- 4️⃣ STATISTIQUES
SELECT 
    '✅ Nettoyage terminé' as status,
    COUNT(*) as total_utilisateurs,
    COUNT(*) FILTER (WHERE raw_user_meta_data->>'type' IS NOT NULL) as avec_type,
    COUNT(*) FILTER (WHERE raw_user_meta_data ? 'role') as avec_role_restant
FROM auth.users;

