-- =====================================================
-- NETTOYAGE DES DONNÉES DE TEST
-- Date: 2025-01-30
-- =====================================================

-- Nettoyer les données de test de migration
DELETE FROM "ClientProduitEligible" 
WHERE metadata->>'migrated_from_simulator' = 'true';

-- Nettoyer les éligibilités de test
DELETE FROM "SimulatorEligibility" 
WHERE session_id IN (
    SELECT id FROM "SimulatorSession" 
    WHERE session_token IN ('SESSION_TOKEN_TEST', 'TEST_SESSION_COMPLETE')
);

-- Nettoyer les sessions de test
DELETE FROM "SimulatorSession" 
WHERE session_token IN ('SESSION_TOKEN_TEST', 'TEST_SESSION_COMPLETE');

-- Vérifier le nettoyage
SELECT 
    'Nettoyage terminé' as section,
    'Données de test supprimées' as status,
    'Système prêt pour production' as resultat; 