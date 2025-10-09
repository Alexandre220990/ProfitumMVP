-- ============================================================================
-- 🔄 MIGRATION COMPLÈTE - COPIER/COLLER DANS SUPABASE
-- ============================================================================
-- Uniformise 'role' → 'type' puis supprime 'role'
-- ============================================================================

-- ÉTAPE 1️⃣: Copier 'role' vers 'type' quand 'type' est NULL
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    raw_user_meta_data,
    '{type}',
    to_jsonb(raw_user_meta_data->>'role')
)
WHERE raw_user_meta_data->>'type' IS NULL 
  AND raw_user_meta_data->>'role' IS NOT NULL;

-- ÉTAPE 2️⃣: Copier 'type' vers 'role' quand 'role' est NULL (pour uniformiser)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    raw_user_meta_data,
    '{role}',
    to_jsonb(raw_user_meta_data->>'type')
)
WHERE raw_user_meta_data->>'role' IS NULL 
  AND raw_user_meta_data->>'type' IS NOT NULL;

-- ÉTAPE 3️⃣: Uniformiser 'apporteur_affaires' → 'apporteur' dans TYPE
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    raw_user_meta_data,
    '{type}',
    '"apporteur"'
)
WHERE raw_user_meta_data->>'type' = 'apporteur_affaires';

-- ÉTAPE 4️⃣: Uniformiser 'apporteur_affaires' → 'apporteur' dans ROLE
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    raw_user_meta_data,
    '{role}',
    '"apporteur"'
)
WHERE raw_user_meta_data->>'role' = 'apporteur_affaires';

-- ÉTAPE 5️⃣: Vérification intermédiaire
SELECT 
    email,
    raw_user_meta_data->>'type' as type,
    raw_user_meta_data->>'role' as role,
    CASE 
        WHEN raw_user_meta_data->>'type' = raw_user_meta_data->>'role' THEN '✅ Synchro'
        WHEN raw_user_meta_data->>'type' IS NULL THEN '❌ Type manquant'
        WHEN raw_user_meta_data->>'role' IS NULL THEN '⚠️ Role manquant'
        ELSE '⚠️ Différent'
    END as status
FROM auth.users
WHERE email IS NOT NULL
ORDER BY email;

-- ÉTAPE 6️⃣: SUPPRIMER le champ 'role' (maintenant redondant)
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE raw_user_meta_data ? 'role';

-- ÉTAPE 7️⃣: Vérification FINALE
SELECT 
    email,
    raw_user_meta_data->>'type' as type,
    raw_user_meta_data->>'role' as role_should_be_null,
    raw_user_meta_data->>'first_name' as first_name,
    raw_user_meta_data->>'last_name' as last_name
FROM auth.users
WHERE email IS NOT NULL
ORDER BY email;

-- ÉTAPE 8️⃣: STATISTIQUES FINALES
SELECT 
    '✅ MIGRATION TERMINÉE' as status,
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE raw_user_meta_data->>'type' = 'client') as clients,
    COUNT(*) FILTER (WHERE raw_user_meta_data->>'type' = 'expert') as experts,
    COUNT(*) FILTER (WHERE raw_user_meta_data->>'type' = 'admin') as admins,
    COUNT(*) FILTER (WHERE raw_user_meta_data->>'type' = 'apporteur') as apporteurs,
    COUNT(*) FILTER (WHERE raw_user_meta_data ? 'role') as role_restant_must_be_0
FROM auth.users;

-- ✅ SUCCÈS si 'role_restant_must_be_0' = 0

