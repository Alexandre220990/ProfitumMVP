-- =====================================================
-- VÉRIFICATION DES DONNÉES POUR LA MIGRATION
-- Date: 2025-01-30
-- =====================================================

-- 0. Vérifier la structure de la table Client
SELECT 
    'Structure table Client' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Client' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 1. Vérifier les sessions de simulateur disponibles
SELECT 
    'Sessions disponibles' as section,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as sessions_completed,
    COUNT(CASE WHEN status = 'migrated' THEN 1 END) as sessions_migrated
FROM "SimulatorSession";

-- 2. Vérifier les clients existants
SELECT 
    'Clients disponibles' as section,
    COUNT(*) as total_clients,
    COUNT(CASE WHEN email = 'test2@test.fr' THEN 1 END) as client_test_exists
FROM "Client";

-- 3. Vérifier les éligibilités pour une session spécifique
SELECT 
    'Éligibilités pour SESSION_TOKEN_TEST' as section,
    COUNT(*) as total_eligibilities
FROM "SimulatorEligibility" se
JOIN "SimulatorSession" ss ON se.session_id = ss.id
WHERE ss.session_token = 'SESSION_TOKEN_TEST';

-- 4. Vérifier les produits déjà associés au client test
SELECT 
    'Produits déjà associés au client test' as section,
    COUNT(*) as produits_associes
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON cpe."clientId" = c.id
WHERE c.email = 'test2@test.fr';

-- 5. Afficher les détails d'une session de test
SELECT 
    'Détails session SESSION_TOKEN_TEST' as section,
    id,
    session_token,
    status,
    created_at,
    updated_at
FROM "SimulatorSession" 
WHERE session_token = 'SESSION_TOKEN_TEST';

-- 6. Afficher les détails du client test (colonnes existantes uniquement)
SELECT 
    'Détails client test2@test.fr' as section,
    id,
    email,
    created_at
FROM "Client" 
WHERE email = 'test2@test.fr'; 