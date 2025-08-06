-- ============================================================================
-- TEST APRÈS CORRECTION DES CONTRAINTES
-- ============================================================================

-- 1. Test GEDDocument avec business (après correction)
INSERT INTO "GEDDocument" (
    title,
    description,
    content,
    category,
    file_path,
    created_by,
    is_active,
    read_time,
    version
)
SELECT 
    'Test Business Document Fixed',
    'Document business après correction',
    'Contenu business de test après correction',
    'business',
    '/documents/business-fixed.pdf',
    id,
    true,
    5,
    1
FROM "Client"
LIMIT 1
RETURNING id, title, category, file_path, created_at;

-- 2. Test GEDDocument avec technical (après correction)
INSERT INTO "GEDDocument" (
    title,
    description,
    content,
    category,
    file_path,
    created_by,
    is_active,
    read_time,
    version
)
SELECT 
    'Test Technical Document Fixed',
    'Document technique après correction',
    'Contenu technique de test après correction',
    'technical',
    '/documents/technical-fixed.pdf',
    id,
    true,
    10,
    1
FROM "Client"
LIMIT 1
RETURNING id, title, category, file_path, created_at;

-- 3. Vérifier les résultats finaux
SELECT 
    'FINAL_SUCCESS_RESULTS' as check_type,
    'GEDDocument' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT category) as unique_categories,
    STRING_AGG(DISTINCT category, ', ') as categories
FROM "GEDDocument"
WHERE title LIKE 'Test%Fixed%';

-- 4. Nettoyer les tests
DELETE FROM "GEDDocument" WHERE title LIKE 'Test%Fixed%'; 