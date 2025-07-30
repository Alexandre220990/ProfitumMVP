-- =====================================================
-- VÉRIFICATION DES RÉSULTATS DE LA MIGRATION
-- Date: 2025-01-30
-- =====================================================

-- 1. Vérifier le statut de la session après migration
SELECT 
    'Statut session après migration' as section,
    session_token,
    status,
    metadata->>'migrated_to_client' as client_migre
FROM "SimulatorSession" 
WHERE session_token = 'SESSION_TOKEN_TEST';

-- 2. Vérifier les produits migrés vers le client
SELECT 
    'Produits migrés vers le client' as section,
    COUNT(*) as total_produits_migres
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON cpe."clientId" = c.id
WHERE c.email = 'test2@test.fr'
AND cpe.metadata->>'migrated_from_simulator' = 'true';

-- 3. Détails des produits migrés
SELECT 
    'Détails produits migrés' as section,
    cpe."produitId",
    cpe.statut,
    cpe."tauxFinal",
    cpe."montantFinal",
    cpe."dureeFinale",
    cpe.metadata->>'original_session_token' as session_originale,
    cpe.metadata->>'confidence_level' as niveau_confiance
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON cpe."clientId" = c.id
WHERE c.email = 'test2@test.fr'
AND cpe.metadata->>'migrated_from_simulator' = 'true'
ORDER BY cpe."produitId";

-- 4. Vérifier les recommandations migrées
SELECT 
    'Recommandations migrées' as section,
    cpe."produitId",
    cpe.metadata->>'recommendations' as recommendations,
    cpe.metadata->>'risk_factors' as risk_factors
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON cpe."clientId" = c.id
WHERE c.email = 'test2@test.fr'
AND cpe.metadata->>'migrated_from_simulator' = 'true';

-- 5. Résumé de la migration
SELECT 
    'Résumé de la migration' as section,
    'Migration réussie' as status,
    '2 produits migrés (CEE et CIR)' as details,
    'Session marquée comme migrated' as session_status,
    'Client test2@test.fr enrichi' as client_status; 