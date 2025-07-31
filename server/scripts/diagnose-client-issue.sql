-- =====================================================
-- DIAGNOSTIC CLIENT ISSUE - wamuchacha@gmail.com
-- Date: 2025-01-30
-- =====================================================

-- 1. VÉRIFIER L'UTILISATEUR DANS AUTH.USERS
SELECT 
    'AUTH.USERS' as table_name,
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

-- 5. VÉRIFIER LES SESSIONS SIMULATEUR
SELECT 
    'SIMULATOR_SESSION' as table_name,
    id,
    session_token,
    status,
    created_at,
    updated_at,
    metadata
FROM "SimulatorSession" 
WHERE metadata::text LIKE '%wamuchacha%' 
   OR session_token IN (
       SELECT DISTINCT session_token 
       FROM "SimulatorResponse" sr
       JOIN "SimulatorSession" ss ON sr.session_id = ss.id
       WHERE sr.response_value::text LIKE '%wamuchacha%'
   );

-- 6. VÉRIFIER LES PRODUITS ÉLIGIBLES
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

-- 7. VÉRIFIER LES RÉPONSES SIMULATEUR
SELECT 
    'SIMULATOR_RESPONSE' as table_name,
    sr.id,
    sr.session_id,
    sr.question_id,
    sr.response_value,
    sr.created_at,
    ss.session_token,
    ss.status as session_status
FROM "SimulatorResponse" sr
JOIN "SimulatorSession" ss ON sr.session_id = ss.id
WHERE sr.response_value::text LIKE '%wamuchacha%'
   OR ss.session_token IN (
       SELECT session_token 
       FROM "SimulatorSession" 
       WHERE metadata::text LIKE '%wamuchacha%'
   );

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
JOIN "SimulatorSession" ss ON se.session_id = ss.id
WHERE ss.session_token IN (
    SELECT session_token 
    FROM "SimulatorSession" 
    WHERE metadata::text LIKE '%wamuchacha%'
);

-- 9. COMPTER LES PRODUITS ÉLIGIBLES PAR CLIENT
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

-- 10. VÉRIFIER LES SESSIONS TEMPORAIRES
SELECT 
    'TEMPORARY_SIMULATION_SESSION' as table_name,
    id,
    sessionId,
    status,
    created_at,
    expiresAt,
    simulationData
FROM "TemporarySimulationSession" 
WHERE simulationData::text LIKE '%wamuchacha%';

-- 11. RÉSUMÉ DES PROBLÈMES POTENTIELS
SELECT 
    'DIAGNOSTIC_SUMMARY' as section,
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'wamuchacha@gmail.com') THEN '✅ Utilisateur auth trouvé'
        ELSE '❌ Utilisateur auth manquant'
    END as auth_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM "Client" WHERE email = 'wamuchacha@gmail.com') THEN '✅ Client trouvé'
        ELSE '❌ Client manquant'
    END as client_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM "Admin" WHERE email = 'wamuchacha@gmail.com') THEN '⚠️ AUSSI ADMIN - CONFLIT!'
        ELSE '✅ Pas de conflit admin'
    END as admin_conflict,
    CASE 
        WHEN EXISTS(SELECT 1 FROM "ClientProduitEligible" cpe JOIN "Client" c ON cpe."clientId" = c.id WHERE c.email = 'wamuchacha@gmail.com') THEN '✅ Produits éligibles trouvés'
        ELSE '❌ Aucun produit éligible'
    END as produits_status; 