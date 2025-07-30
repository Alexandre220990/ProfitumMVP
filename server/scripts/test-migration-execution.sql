-- =====================================================
-- TEST D'EXÉCUTION DE LA FONCTION DE MIGRATION
-- Date: 2025-01-30
-- =====================================================

-- Test de la fonction avec le client existant
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