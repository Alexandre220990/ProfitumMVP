-- ============================================================================
-- VÉRIFICATION DU STATUT ADMIN
-- Email : grandjean.alexandre5@gmail.com
-- Date : 2025-11-03
-- ============================================================================

-- 1. Vérifier si l'admin existe dans la table Admin
SELECT 
    id,
    email,
    name,
    is_active,
    created_at,
    updated_at
FROM "Admin"
WHERE email = 'grandjean.alexandre5@gmail.com';

-- 2. Vérifier le user_id dans auth.users (Supabase Auth)
SELECT 
    id,
    email,
    raw_user_meta_data->>'type' as user_type,
    raw_user_meta_data->>'name' as name,
    email_confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE email = 'grandjean.alexandre5@gmail.com';

-- 3. Vérifier tous les admins dans la table Admin
SELECT 
    id,
    email,
    name,
    is_active,
    CASE 
        WHEN is_active = true THEN '✅ Actif'
        WHEN is_active = false THEN '❌ Inactif'
        ELSE '⚠️ NULL'
    END as statut_lisible
FROM "Admin"
ORDER BY created_at DESC;

-- 4. Si l'admin n'existe pas dans la table Admin, créer l'entrée
-- Décommentez et exécutez cette section si l'admin n'existe pas
/*
INSERT INTO "Admin" (id, email, name, is_active)
VALUES (
    '61797a61-edde-4816-b818-00015b627fe1', 
    'grandjean.alexandre5@gmail.com',
    'Alexandre Grandjean',
    true
)
ON CONFLICT (id) DO UPDATE
SET 
    is_active = true,
    updated_at = NOW();
*/

-- 5. Si l'admin existe mais est inactif, l'activer
-- Décommentez et exécutez cette ligne si nécessaire
/*
UPDATE "Admin"
SET is_active = true, updated_at = NOW()
WHERE email = 'grandjean.alexandre5@gmail.com';
*/

