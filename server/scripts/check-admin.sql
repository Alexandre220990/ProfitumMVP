-- Script pour identifier l'admin dans toutes les tables
-- Exécutez ce script dans votre base de données Supabase

-- 1. Vérifier dans la table Admin
SELECT 
    'Admin' as table_name,
    id,
    email,
    name,
    created_at,
    updated_at
FROM "Admin"
WHERE email IS NOT NULL
ORDER BY created_at DESC;

-- 2. Vérifier dans la table Client
SELECT 
    'Client' as table_name,
    id,
    email,
    name,
    created_at,
    updated_at
FROM "Client"
WHERE email IS NOT NULL
ORDER BY created_at DESC;

-- 3. Vérifier dans la table Expert
SELECT 
    'Expert' as table_name,
    id,
    email,
    name,
    created_at,
    updated_at
FROM "Expert"
WHERE email IS NOT NULL
ORDER BY created_at DESC;

-- 4. Recherche par email spécifique (remplacez par votre email)
-- SELECT 
--     'Admin' as table_name,
--     id,
--     email,
--     name,
--     created_at
-- FROM "Admin"
-- WHERE email = 'votre-email@profitum.app'
-- UNION ALL
-- SELECT 
--     'Client' as table_name,
--     id,
--     email,
--     name,
--     created_at
-- FROM "Client"
-- WHERE email = 'votre-email@profitum.app'
-- UNION ALL
-- SELECT 
--     'Expert' as table_name,
--     id,
--     email,
--     name,
--     created_at
-- FROM "Expert"
-- WHERE email = 'votre-email@profitum.app';

-- 5. Compter le nombre d'utilisateurs par table
SELECT 
    'Admin' as table_name,
    COUNT(*) as user_count
FROM "Admin"
UNION ALL
SELECT 
    'Client' as table_name,
    COUNT(*) as user_count
FROM "Client"
UNION ALL
SELECT 
    'Expert' as table_name,
    COUNT(*) as user_count
FROM "Expert";

-- 6. Vérifier les utilisateurs avec des emails similaires (pour identifier les doublons)
SELECT 
    email,
    COUNT(*) as count,
    STRING_AGG(table_name, ', ') as tables
FROM (
    SELECT 'Admin' as table_name, email FROM "Admin" WHERE email IS NOT NULL
    UNION ALL
    SELECT 'Client' as table_name, email FROM "Client" WHERE email IS NOT NULL
    UNION ALL
    SELECT 'Expert' as table_name, email FROM "Expert" WHERE email IS NOT NULL
) all_users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;
