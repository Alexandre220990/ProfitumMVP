-- =====================================================
-- SCRIPT DE CORRECTION POUR LES CLIENTS SANS AUTH_ID
-- Date: 2025-01-30
-- =====================================================

-- 1. Identifier les clients sans auth_id
SELECT 
    'Clients sans auth_id à corriger' as section,
    id,
    email,
    name,
    company_name,
    statut,
    created_at
FROM "Client"
WHERE auth_id IS NULL
ORDER BY created_at DESC;

-- 2. Identifier les utilisateurs Auth correspondants
SELECT 
    'Utilisateurs Auth disponibles' as section,
    au.id as auth_id,
    au.email as auth_email,
    au.created_at as auth_created_at,
    c.id as client_id,
    c.email as client_email,
    c.name as client_name,
    CASE 
        WHEN c.email = au.email THEN 'Email correspondant'
        ELSE 'Email différent'
    END as match_status
FROM auth.users au
LEFT JOIN "Client" c ON au.email = c.email
WHERE au.email LIKE '%@%'
ORDER BY au.created_at DESC;

-- 3. Mettre à jour les clients avec leur auth_id correspondant
-- (Script de correction - à exécuter avec précaution)
UPDATE "Client" 
SET 
    auth_id = au.id,
    updated_at = NOW()
FROM auth.users au
WHERE "Client".email = au.email 
    AND "Client".auth_id IS NULL
    AND au.email LIKE '%@%';

-- 4. Vérifier le résultat de la correction
SELECT 
    'Résultat de la correction' as section,
    c.id as client_id,
    c.email as client_email,
    c.auth_id,
    au.email as auth_email,
    CASE 
        WHEN c.auth_id = au.id THEN 'Correction réussie'
        WHEN c.auth_id IS NULL THEN 'Pas d auth_id trouvé'
        ELSE 'Incohérence'
    END as correction_status
FROM "Client" c
LEFT JOIN auth.users au ON c.auth_id = au.id
WHERE c.email LIKE '%@%'
ORDER BY c.created_at DESC;

-- 5. Vérifier les clients restants sans auth_id
SELECT 
    'Clients restants sans auth_id' as section,
    id,
    email,
    name,
    company_name,
    statut,
    created_at
FROM "Client"
WHERE auth_id IS NULL
ORDER BY created_at DESC;

-- 6. Statistiques finales
SELECT 
    'Statistiques finales' as section,
    COUNT(*) as total_clients,
    COUNT(auth_id) as clients_with_auth_id,
    COUNT(*) - COUNT(auth_id) as clients_without_auth_id,
    ROUND(COUNT(auth_id) * 100.0 / COUNT(*), 2) as percentage_with_auth_id
FROM "Client"; 