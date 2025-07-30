-- =====================================================
-- DEBUG CLIENT SPÉCIFIQUE
-- Client ID: 546a07b3-564e-4838-aaa4-96128ebca448
-- Date: 2025-01-30
-- =====================================================

-- 1. Vérifier le client spécifique
SELECT 
    'Client spécifique' as section,
    id,
    email,
    name,
    company_name,
    auth_id,
    statut,
    created_at,
    updated_at
FROM "Client"
WHERE id = '546a07b3-564e-4838-aaa4-96128ebca448';

-- 2. Vérifier s'il y a un utilisateur Auth correspondant
SELECT 
    'Utilisateur Auth correspondant' as section,
    au.id as auth_id,
    au.email as auth_email,
    au.created_at as auth_created_at,
    c.id as client_id,
    c.email as client_email
FROM auth.users au
LEFT JOIN "Client" c ON au.id = c.auth_id
WHERE c.id = '546a07b3-564e-4838-aaa4-96128ebca448';

-- 3. Vérifier les produits éligibles de ce client
SELECT 
    'Produits éligibles du client' as section,
    cpe.id,
    cpe."clientId",
    cpe."produitId",
    cpe.statut,
    cpe."tauxFinal",
    cpe."montantFinal",
    cpe.created_at,
    pe.nom as produit_nom
FROM "ClientProduitEligible" cpe
LEFT JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
WHERE cpe."clientId" = '546a07b3-564e-4838-aaa4-96128ebca448'
ORDER BY cpe.created_at DESC;

-- 4. Vérifier les sessions de simulateur pour ce client
SELECT 
    'Sessions simulateur' as section,
    id,
    session_token,
    status,
    created_at,
    updated_at,
    metadata
FROM "SimulatorSession"
WHERE metadata::text LIKE '%546a07b3-564e-4838-aaa4-96128ebca448%'
   OR metadata::text LIKE '%test2@test.fr%'
ORDER BY created_at DESC;

-- 5. Vérifier les simulations pour ce client
SELECT 
    'Simulations du client' as section,
    id,
    "clientId",
    type,
    statut,
    created_at,
    updated_at
FROM "Simulation"
WHERE "clientId" = '546a07b3-564e-4838-aaa4-96128ebca448'
ORDER BY created_at DESC;

-- 6. Vérifier les simulations traitées
SELECT 
    'Simulations traitées' as section,
    id,
    clientid,
    status,
    createdat,
    updatedat
FROM "SimulationProcessed"
WHERE clientid = '546a07b3-564e-4838-aaa4-96128ebca448'
ORDER BY createdat DESC;

-- 7. Vérifier les utilisateurs Auth avec l'email test2@test.fr
SELECT 
    'Utilisateurs Auth avec email test2@test.fr' as section,
    id,
    email,
    created_at
FROM auth.users
WHERE email = 'test2@test.fr';

-- 8. Vérifier tous les clients avec cet email
SELECT 
    'Clients avec email test2@test.fr' as section,
    id,
    email,
    name,
    company_name,
    auth_id,
    statut,
    created_at
FROM "Client"
WHERE email = 'test2@test.fr'
ORDER BY created_at DESC; 