-- ============================================================================
-- TEST D'ALIGNEMENT FRONTEND-BACKEND
-- ============================================================================

-- 1. Récupérer un client existant pour les tests
WITH test_client AS (
    SELECT id FROM "Client" LIMIT 1
)
-- Test de création d'un événement calendrier
INSERT INTO "CalendarEvent" (
    title,
    description,
    start_date,
    end_date,
    type,
    priority,
    status,
    category,
    client_id,
    created_by,
    color
)
SELECT 
    'Test Alignement Frontend',
    'Test pour vérifier l''alignement',
    NOW(),
    NOW() + INTERVAL '1 hour',
    'meeting',
    'medium',
    'pending',
    'client',
    id,
    id,
    '#3B82F6'
FROM test_client
RETURNING id, title, type, priority, status, category;

-- 2. Test de création d'une simulation
INSERT INTO simulations (
    client_id,
    type,
    status,
    answers,
    expires_at
)
SELECT 
    id,
    'temporaire',
    'en_cours',
    '{"test": "alignment"}',
    NOW() + INTERVAL '24 hours'
FROM test_client
RETURNING id, client_id, type, status;

-- 3. Test de création d'une simulation traitée
INSERT INTO "SimulationProcessed" (
    clientid,
    type,
    statut,
    data
)
SELECT 
    id,
    'test',
    'pending',
    '{"test": "alignment"}'
FROM test_client
RETURNING id, clientid, type, statut;

-- 4. Vérifier les données insérées
SELECT 
    'CalendarEvent' as table_name,
    id::text,
    title,
    type,
    priority,
    status,
    category
FROM "CalendarEvent" 
WHERE title = 'Test Alignement Frontend'

UNION ALL

SELECT 
    'simulations' as table_name,
    id::text,
    type,
    type,
    status,
    status,
    'simulation'
FROM simulations 
WHERE type = 'temporaire'

UNION ALL

SELECT 
    'SimulationProcessed' as table_name,
    id::text,
    type,
    type,
    statut,
    statut,
    'processed'
FROM "SimulationProcessed" 
WHERE type = 'test'

ORDER BY table_name;

-- 5. Nettoyer les données de test
DELETE FROM "CalendarEvent" WHERE title = 'Test Alignement Frontend';
DELETE FROM simulations WHERE type = 'temporaire';
DELETE FROM "SimulationProcessed" WHERE type = 'test'; 