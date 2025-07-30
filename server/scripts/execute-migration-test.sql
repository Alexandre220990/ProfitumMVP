-- =====================================================
-- EXÉCUTION DU TEST DE MIGRATION
-- Date: 2025-01-30
-- =====================================================

-- Test de la fonction de migration
SELECT 
    'Test de migration' as section,
    migrate_simulator_to_existing_client('SESSION_TOKEN_TEST', 'test2@test.fr') as resultat;

-- Vérification après migration
SELECT 
    'Vérification après migration' as section,
    COUNT(*) as total_produits_migres
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON cpe."clientId" = c.id
WHERE c.email = 'test2@test.fr'
AND cpe.metadata->>'migrated_from_simulator' = 'true';

-- Afficher les détails des produits migrés
SELECT 
    'Détails produits migrés' as section,
    cpe."produitId",
    cpe.statut,
    cpe."tauxFinal",
    cpe."montantFinal",
    cpe.metadata->>'original_session_token' as session_originale,
    cpe.metadata->>'confidence_level' as niveau_confiance
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON cpe."clientId" = c.id
WHERE c.email = 'test2@test.fr'
AND cpe.metadata->>'migrated_from_simulator' = 'true';

-- Vérifier le statut de la session après migration
SELECT 
    'Statut session après migration' as section,
    session_token,
    status,
    metadata->>'migrated_to_client' as client_migre
FROM "SimulatorSession" 
WHERE session_token = 'SESSION_TOKEN_TEST'; 