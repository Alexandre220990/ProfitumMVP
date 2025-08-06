-- ============================================================================
-- TEST AVEC LES VRAIES DONNÉES EXISTANTES
-- ============================================================================

-- 1. Test de création d'un événement calendrier avec de vraies données
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
    expert_id,
    created_by,
    color
)
SELECT 
    'Test avec vraies données',
    'Test d''alignement avec client et expert existants',
    NOW(),
    NOW() + INTERVAL '1 hour',
    'meeting',
    'medium',
    'pending',
    'collaborative',
    c.id,
    e.id,
    c.id,
    '#3B82F6'
FROM "Client" c, "Expert" e
WHERE c.id = '25274ba6-67e6-4151-901c-74851fe2d82a'::uuid
LIMIT 1
RETURNING id, title, type, priority, status, category, client_id, expert_id;

-- 2. Test de création d'une simulation avec de vraies données
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
    '{"test": "real_data"}',
    NOW() + INTERVAL '24 hours'
FROM "Client"
WHERE id = '25274ba6-67e6-4151-901c-74851fe2d82a'::uuid
RETURNING id, client_id, type, status;

-- 3. Vérifier les relations avec les vraies données
SELECT 
    'REAL_DATA_RELATIONS' as check_type,
    cpe.id as cpe_id,
    c.name as client_name,
    p.nom as product_name,
    e.name as expert_name,
    cpe.statut,
    cpe."montantFinal",
    cpe."current_step",
    cpe.progress
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON c.id = cpe."clientId"
JOIN "ProduitEligible" p ON p.id = cpe."produitId"
LEFT JOIN "Expert" e ON e.id = cpe.expert_id
ORDER BY cpe.created_at DESC; 