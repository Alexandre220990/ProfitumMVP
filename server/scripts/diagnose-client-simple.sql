-- =====================================================
-- DIAGNOSTIC CLIENT SIMPLIFIÉ - wamuchacha@gmail.com
-- Date: 2025-01-30
-- =====================================================

-- 1. VÉRIFIER L'UTILISATEUR DANS AUTH.USERS
SELECT 'AUTH.USERS' as table_name, id, email, created_at
FROM auth.users 
WHERE email = 'wamuchacha@gmail.com';

-- 2. VÉRIFIER LE CLIENT
SELECT 'CLIENT' as table_name, id, email, auth_id, name, company_name, created_at
FROM "Client" 
WHERE email = 'wamuchacha@gmail.com';

-- 3. VÉRIFIER L'ADMIN (si existe)
SELECT 'ADMIN' as table_name, id, email, name, created_at
FROM "Admin" 
WHERE email = 'wamuchacha@gmail.com';

-- 4. VÉRIFIER L'EXPERT (si existe)
SELECT 'EXPERT' as table_name, id, email, name, approval_status, created_at
FROM "Expert" 
WHERE email = 'wamuchacha@gmail.com';

-- 5. VÉRIFIER LES PRODUITS ÉLIGIBLES
SELECT 'CLIENT_PRODUIT_ELIGIBLE' as table_name, cpe.id, cpe.statut, cpe."tauxFinal", cpe."montantFinal", pe.nom as produit_nom
FROM "ClientProduitEligible" cpe
LEFT JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
LEFT JOIN "Client" c ON cpe."clientId" = c.id
WHERE c.email = 'wamuchacha@gmail.com';

-- 6. COMPTER LES PRODUITS ÉLIGIBLES
SELECT 'COMPTE_PRODUITS' as table_name, c.email, COUNT(cpe.id) as nombre_produits
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON c.id = cpe."clientId"
WHERE c.email = 'wamuchacha@gmail.com'
GROUP BY c.id, c.email;

-- 7. VÉRIFIER LES SESSIONS SIMULATEUR
SELECT 'SIMULATOR_SESSION' as table_name, id, session_token, status, created_at
FROM "SimulatorSession" 
WHERE metadata::text LIKE '%wamuchacha%';

-- 8. RÉSUMÉ DES PROBLÈMES
SELECT 
    'DIAGNOSTIC_SUMMARY' as section,
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'wamuchacha@gmail.com') THEN 'Utilisateur auth trouvé'
        ELSE 'Utilisateur auth manquant'
    END as auth_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM "Client" WHERE email = 'wamuchacha@gmail.com') THEN 'Client trouvé'
        ELSE 'Client manquant'
    END as client_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM "Admin" WHERE email = 'wamuchacha@gmail.com') THEN 'AUSSI ADMIN - CONFLIT!'
        ELSE 'Pas de conflit admin'
    END as admin_conflict,
    CASE 
        WHEN EXISTS(SELECT 1 FROM "ClientProduitEligible" cpe JOIN "Client" c ON cpe."clientId" = c.id WHERE c.email = 'wamuchacha@gmail.com') THEN 'Produits éligibles trouvés'
        ELSE 'Aucun produit éligible'
    END as produits_status; 