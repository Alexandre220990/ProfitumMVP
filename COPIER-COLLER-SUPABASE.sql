-- ============================================================================
-- 🚀 MIGRATION SUPABASE - COPIER/COLLER DIRECTEMENT
-- ============================================================================
-- Uniformisation: 'apporteur_affaires' → 'apporteur'
-- ============================================================================

-- 1️⃣ Mettre à jour le TYPE
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    raw_user_meta_data,
    '{type}',
    '"apporteur"'
)
WHERE raw_user_meta_data->>'type' = 'apporteur_affaires';

-- 2️⃣ Mettre à jour le ROLE
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    raw_user_meta_data,
    '{role}',
    '"apporteur"'
)
WHERE raw_user_meta_data->>'role' = 'apporteur_affaires';

-- 3️⃣ Vérification finale
SELECT 
    email,
    raw_user_meta_data->>'type' as type,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'first_name' as first_name,
    raw_user_meta_data->>'last_name' as last_name
FROM auth.users
WHERE raw_user_meta_data->>'type' = 'apporteur'
   OR raw_user_meta_data->>'role' = 'apporteur';

-- ✅ Vous devriez voir vos apporteurs avec type='apporteur' et role='apporteur'

