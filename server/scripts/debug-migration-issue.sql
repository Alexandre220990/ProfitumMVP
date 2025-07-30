-- =====================================================
-- DÉBOGAGE DE LA MIGRATION
-- Date: 2025-01-30
-- =====================================================

-- 1. Vérifier que la session existe et a le bon statut
SELECT 
    'Session de test' as section,
    id,
    session_token,
    status,
    created_at
FROM "SimulatorSession" 
WHERE session_token = 'SESSION_TOKEN_TEST';

-- 2. Vérifier que les éligibilités existent
SELECT 
    'Éligibilités de test' as section,
    se.id,
    se.session_id,
    se.produit_id,
    se.eligibility_score,
    se.estimated_savings,
    se.confidence_level
FROM "SimulatorEligibility" se
JOIN "SimulatorSession" ss ON se.session_id = ss.id
WHERE ss.session_token = 'SESSION_TOKEN_TEST';

-- 3. Vérifier que le client existe
SELECT 
    'Client de test' as section,
    id,
    email,
    created_at
FROM "Client" 
WHERE email = 'test2@test.fr';

-- 4. Lister les tables liées aux produits
SELECT 
    'Tables produits' as section,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name ILIKE '%produit%';

-- 5. Test de la fonction avec gestion d'erreur
DO $$
DECLARE
    result json;
BEGIN
    result := migrate_simulator_to_existing_client('SESSION_TOKEN_TEST', 'test2@test.fr');
    RAISE NOTICE 'Résultat de la migration: %', result;
END $$;