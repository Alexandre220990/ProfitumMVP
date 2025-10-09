-- ============================================================================
-- 🔄 MIGRATION SUPABASE - COPIER/COLLER CE FICHIER
-- ============================================================================
-- Uniformisation: 'apporteur_affaires' → 'apporteur'
-- ============================================================================

-- 1️⃣ Mettre à jour le TYPE dans auth.users
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{type}',
    '"apporteur"'::jsonb
)
WHERE raw_user_meta_data->>'type' = 'apporteur_affaires';

-- 2️⃣ Mettre à jour le ROLE dans auth.users  
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"apporteur"'::jsonb
)
WHERE raw_user_meta_data->>'role' = 'apporteur_affaires';

-- 3️⃣ Vérification
SELECT 
    raw_user_meta_data->>'email' as email,
    raw_user_meta_data->>'type' as type,
    raw_user_meta_data->>'role' as role
FROM auth.users
WHERE raw_user_meta_data->>'role' IN ('apporteur', 'apporteur_affaires')
   OR raw_user_meta_data->>'type' IN ('apporteur', 'apporteur_affaires');

