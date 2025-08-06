-- ============================================================================
-- TEST SIMPLE D'ALIGNEMENT
-- ============================================================================

-- 1. Vérifier les données existantes
SELECT 
    'EXISTING_DATA' as check_type,
    'Client' as table_name,
    COUNT(*) as total_records
FROM "Client"

UNION ALL

SELECT 
    'EXISTING_DATA' as check_type,
    'Expert' as table_name,
    COUNT(*) as total_records
FROM "Expert"

UNION ALL

SELECT 
    'EXISTING_DATA' as check_type,
    'ClientProduitEligible' as table_name,
    COUNT(*) as total_records
FROM "ClientProduitEligible"

UNION ALL

SELECT 
    'EXISTING_DATA' as check_type,
    'CalendarEvent' as table_name,
    COUNT(*) as total_records
FROM "CalendarEvent"

UNION ALL

SELECT 
    'EXISTING_DATA' as check_type,
    'simulations' as table_name,
    COUNT(*) as total_records
FROM simulations

ORDER BY table_name;

-- 2. Test simple de création d'événement
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
    color
)
SELECT 
    'Test Alignement Simple',
    'Test simple pour vérifier l''alignement',
    NOW(),
    NOW() + INTERVAL '1 hour',
    'meeting',
    'medium',
    'pending',
    'client',
    id,
    '#3B82F6'
FROM "Client"
LIMIT 1
RETURNING id, title, type, priority, status, category, client_id;

-- 3. Nettoyer le test
DELETE FROM "CalendarEvent" WHERE title = 'Test Alignement Simple'; 