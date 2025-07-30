-- =====================================================
-- SCRIPT DE DIAGNOSTIC POUR LE PROBLÈME DE MIGRATION
-- Date: 2025-01-30
-- =====================================================

-- 1. Vérifier la structure de la table Client
SELECT 
    'Structure Client' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Client'
ORDER BY ordinal_position;

-- 2. Vérifier les clients sans auth_id
SELECT 
    'Clients sans auth_id' as section,
    id,
    email,
    name,
    company_name,
    statut,
    created_at
FROM "Client"
WHERE auth_id IS NULL
ORDER BY created_at DESC;

-- 3. Vérifier les clients avec auth_id
SELECT 
    'Clients avec auth_id' as section,
    id,
    email,
    name,
    company_name,
    auth_id,
    statut,
    created_at
FROM "Client"
WHERE auth_id IS NOT NULL
ORDER BY created_at DESC;

-- 4. Vérifier les utilisateurs Auth
SELECT 
    'Utilisateurs Auth' as section,
    id,
    email,
    created_at
FROM auth.users
WHERE email LIKE '%@%'
ORDER BY created_at DESC;

-- 5. Vérifier les sessions de simulateur
SELECT 
    'Sessions Simulateur' as section,
    id,
    session_token,
    status,
    created_at,
    updated_at
FROM "SimulatorSession"
ORDER BY created_at DESC;

-- 6. Vérifier les ClientProduitEligible existants
SELECT 
    'ClientProduitEligible existants' as section,
    cpe.id,
    cpe."clientId",
    cpe."produitId",
    cpe.statut,
    cpe."tauxFinal",
    cpe."montantFinal",
    cpe.created_at,
    c.email as client_email,
    pe.nom as produit_nom
FROM "ClientProduitEligible" cpe
LEFT JOIN "Client" c ON cpe."clientId" = c.id
LEFT JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
ORDER BY cpe.created_at DESC;

-- 7. Vérifier les politiques RLS sur ClientProduitEligible
SELECT 
    'Politiques RLS ClientProduitEligible' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'ClientProduitEligible';

-- 8. Vérifier les permissions sur les tables
SELECT 
    'Permissions Client' as section,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'Client';

SELECT 
    'Permissions ClientProduitEligible' as section,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'ClientProduitEligible';

-- 9. Vérifier les dernières insertions ClientProduitEligible
SELECT 
    'Dernières insertions ClientProduitEligible' as section,
    cpe.id,
    cpe."clientId",
    cpe."produitId",
    cpe.statut,
    cpe.created_at,
    c.email as client_email,
    c.auth_id,
    pe.nom as produit_nom
FROM "ClientProduitEligible" cpe
LEFT JOIN "Client" c ON cpe."clientId" = c.id
LEFT JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
ORDER BY cpe.created_at DESC
LIMIT 10;

-- 10. Vérifier la correspondance auth_id vs client_id
SELECT 
    'Correspondance Auth-Client' as section,
    c.id as client_id,
    c.email as client_email,
    c.auth_id,
    au.id as auth_user_id,
    au.email as auth_email,
    CASE 
        WHEN c.auth_id = au.id THEN 'Correspondance OK'
        WHEN c.auth_id IS NULL THEN 'Client sans auth_id'
        WHEN au.id IS NULL THEN 'Auth_id invalide'
        ELSE 'Incohérence'
    END as status
FROM "Client" c
LEFT JOIN auth.users au ON c.auth_id = au.id
ORDER BY c.created_at DESC;