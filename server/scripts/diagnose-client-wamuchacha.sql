-- =====================================================
-- DIAGNOSTIC CLIENT ISSUE - wamuchacha@gmail.com
-- Date: 2025-01-30
-- =====================================================

-- 1. VÉRIFIER L'UTILISATEUR DANS AUTH.USERS
SELECT 
    'AUTH_USERS' as table_name,
    id,
    email,
    raw_user_meta_data,
    created_at,
    updated_at
FROM auth.users 
WHERE email = 'wamuchacha@gmail.com';

-- 2. VÉRIFIER LE CLIENT
SELECT 
    'CLIENT' as table_name,
    id,
    email,
    auth_id,
    name,
    company_name,
    created_at,
    updated_at
FROM "Client" 
WHERE email = 'wamuchacha@gmail.com';

-- 3. VÉRIFIER L'ADMIN (si existe)
SELECT 
    'ADMIN' as table_name,
    id,
    email,
    name,
    created_at,
    updated_at
FROM "Admin" 
WHERE email = 'wamuchacha@gmail.com';

-- 4. VÉRIFIER L'EXPERT (si existe)
SELECT 
    'EXPERT' as table_name,
    id,
    email,
    name,
    approval_status,
    created_at,
    updated_at
FROM "Expert" 
WHERE email = 'wamuchacha@gmail.com';

-- 5. VÉRIFIER LES PRODUITS ÉLIGIBLES
SELECT 
    'CLIENT_PRODUIT_ELIGIBLE' as table_name,
    cpe.id,
    cpe."clientId",
    cpe."produitId",
    cpe.statut,
    cpe."tauxFinal",
    cpe."montantFinal",
    cpe.created_at,
    cpe.updated_at,
    pe.nom as produit_nom,
    c.email as client_email
FROM "ClientProduitEligible" cpe
LEFT JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
LEFT JOIN "Client" c ON cpe."clientId" = c.id
WHERE c.email = 'wamuchacha@gmail.com';

-- 6. COMPTER LES PRODUITS ÉLIGIBLES PAR CLIENT
SELECT 
    'COMPTE_PRODUITS_ELIGIBLES' as table_name,
    c.email,
    COUNT(cpe.id) as nombre_produits_eligibles,
    COUNT(CASE WHEN cpe.statut = 'eligible' THEN 1 END) as produits_eligibles,
    COUNT(CASE WHEN cpe.statut = 'en_cours' THEN 1 END) as produits_en_cours,
    COUNT(CASE WHEN cpe.statut = 'non_eligible' THEN 1 END) as produits_non_eligibles
FROM "Client" c
LEFT JOIN "ClientProduitEligible" cpe ON c.id = cpe."clientId"
WHERE c.email = 'wamuchacha@gmail.com'
GROUP BY c.id, c.email;

-- 7. VÉRIFIER LES SESSIONS SIMULATEUR
SELECT 
    'SIMULATOR_SESSION' as table_name,
    id,
    session_token,
    status,
    created_at,
    updated_at,
    metadata
FROM "SimulatorSession" 
WHERE metadata::text LIKE '%wamuchacha%';

-- 8. VÉRIFIER LES ÉLIGIBILITÉS SIMULATEUR
SELECT 
    'SIMULATOR_ELIGIBILITY' as table_name,
    se.id,
    se.session_id,
    se.produit_id,
    se.eligibility_score,
    se.estimated_savings,
    se.confidence_level,
    se.created_at,
    ss.session_token,
    ss.status as session_status
FROM "SimulatorEligibility" se
LEFT JOIN "SimulatorSession" ss ON se.session_id = ss.id
WHERE ss.metadata::text LIKE '%wamuchacha%';

-- 9. RÉSUMÉ DES PROBLÈMES POTENTIELS
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

-- 10. VÉRIFIER SI L'UTILISATEUR EST DANS PLUSIEURS TABLES (CONFLIT DE TYPE)
SELECT 
    'CONFLIT_TYPE_UTILISATEUR' as section,
    COALESCE(c.email, e.email, a.email) as email,
    CASE WHEN c.id IS NOT NULL THEN 'client' ELSE NULL END as est_client,
    CASE WHEN e.id IS NOT NULL THEN 'expert' ELSE NULL END as est_expert,
    CASE WHEN a.id IS NOT NULL THEN 'admin' ELSE NULL END as est_admin,
    CASE 
        WHEN (c.id IS NOT NULL AND e.id IS NOT NULL) OR 
             (c.id IS NOT NULL AND a.id IS NOT NULL) OR 
             (e.id IS NOT NULL AND a.id IS NOT NULL) THEN 'CONFLIT!'
        ELSE 'OK'
    END as status_conflit
FROM "Client" c
FULL OUTER JOIN "Expert" e ON c.email = e.email
FULL OUTER JOIN "Admin" a ON COALESCE(c.email, e.email) = a.email
WHERE COALESCE(c.email, e.email, a.email) = 'wamuchacha@gmail.com';