-- =====================================================
-- VÉRIFICATION DES RÉSULTATS DE LA CORRECTION
-- Date: 2025-01-30
-- =====================================================

-- 1. Vérifier les clients avec auth_id (devraient maintenant avoir des produits)
SELECT 
    'Clients avec auth_id et leurs produits' as section,
    c.id as client_id,
    c.email as client_email,
    c.auth_id,
    COUNT(cpe.id) as nombre_produits_eligibles,
    CASE 
        WHEN COUNT(cpe.id) > 0 THEN 'Produits présents'
        ELSE 'Aucun produit'
    END as status
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON c.id = cpe."clientId"
WHERE c.auth_id IS NOT NULL
GROUP BY c.id, c.email, c.auth_id
ORDER BY nombre_produits_eligibles DESC, c.created_at DESC;

-- 2. Vérifier les clients restants sans auth_id
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

-- 3. Vérifier les utilisateurs Auth sans client correspondant
SELECT 
    'Utilisateurs Auth sans client' as section,
    au.id as auth_id,
    au.email as auth_email,
    au.created_at as auth_created_at,
    CASE 
        WHEN c.id IS NULL THEN 'Pas de client'
        ELSE 'Client trouvé'
    END as status
FROM auth.users au
LEFT JOIN "Client" c ON au.id = c.auth_id
WHERE au.email LIKE '%@%' AND c.id IS NULL
ORDER BY au.created_at DESC;

-- 4. Test de la route /api/client/produits-eligibles (simulation)
-- Vérifier qu'un client avec auth_id peut voir ses produits
SELECT 
    'Test route produits-eligibles' as section,
    c.id as client_id,
    c.email as client_email,
    c.auth_id,
    COUNT(cpe.id) as produits_disponibles,
    CASE 
        WHEN c.auth_id IS NOT NULL THEN 'Route devrait fonctionner'
        ELSE 'Route ne fonctionnera pas'
    END as route_status
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON c.id = cpe."clientId"
WHERE c.auth_id IS NOT NULL
GROUP BY c.id, c.email, c.auth_id
ORDER BY produits_disponibles DESC
LIMIT 5;

-- 5. Statistiques des produits éligibles par client
SELECT 
    'Statistiques produits par client' as section,
    COUNT(DISTINCT c.id) as total_clients_avec_auth_id,
    COUNT(cpe.id) as total_produits_eligibles,
    ROUND(AVG(produits_par_client.nombre), 2) as moyenne_produits_par_client,
    MAX(produits_par_client.nombre) as max_produits_par_client,
    MIN(produits_par_client.nombre) as min_produits_par_client
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON c.id = cpe."clientId"
LEFT JOIN (
    SELECT 
        c2.id,
        COUNT(cpe2.id) as nombre
    FROM "Client" c2
    LEFT JOIN "ClientProduitEligible" cpe2 ON c2.id = cpe2."clientId"
    WHERE c2.auth_id IS NOT NULL
    GROUP BY c2.id
) produits_par_client ON c.id = produits_par_client.id
WHERE c.auth_id IS NOT NULL;

-- 6. Vérifier les produits éligibles récents
SELECT 
    'Produits éligibles récents' as section,
    cpe.id,
    cpe."clientId",
    cpe."produitId",
    cpe.statut,
    cpe."tauxFinal",
    cpe."montantFinal",
    cpe.created_at,
    c.email as client_email,
    c.auth_id,
    pe.nom as produit_nom
FROM "ClientProduitEligible" cpe
LEFT JOIN "Client" c ON cpe."clientId" = c.id
LEFT JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
WHERE c.auth_id IS NOT NULL
ORDER BY cpe.created_at DESC
LIMIT 10; 