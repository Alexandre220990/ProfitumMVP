-- ============================================================================
-- TEST FINAL SYSTÈME DOCUMENTAIRE
-- ============================================================================

-- 1. Vérifier l'existence des tables d'utilisateurs
SELECT 
    'CLIENT_CHECK' as check_type,
    COUNT(*) as total_clients
FROM "Client";

SELECT 
    'EXPERT_CHECK' as check_type,
    COUNT(*) as total_experts
FROM "Expert";

-- 2. Test GEDDocument avec business
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
    'Test Business Document',
    'Document business pour test',
    'Contenu business de test',
    'business',
    '/documents/business-test.pdf',
    id,
    true,
    5,
    1
FROM "Client"
LIMIT 1
RETURNING id, title, category, file_path, created_at;

-- 3. Test GEDDocument avec technical
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
    'Test Technical Document',
    'Document technique pour test',
    'Contenu technique de test',
    'technical',
    '/documents/technical-test.pdf',
    id,
    true,
    10,
    1
FROM "Client"
LIMIT 1
RETURNING id, title, category, file_path, created_at;

-- 4. Test admin_documents
INSERT INTO "admin_documents" (
    title,
    category,
    content,
    version,
    author,
    status
)
VALUES (
    'Test Admin Document Final',
    'test',
    'Contenu admin de test final',
    '1.0',
    'Admin',
    'draft'
)
RETURNING id, title, category, status, created_at;

-- 5. Vérifier les résultats
SELECT 
    'FINAL_RESULTS' as check_type,
    'GEDDocument' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT category) as unique_categories
FROM "GEDDocument"
WHERE title LIKE 'Test%';

SELECT 
    'FINAL_RESULTS' as check_type,
    'admin_documents' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT category) as unique_categories
FROM "admin_documents"
WHERE title LIKE 'Test%';

-- 6. Nettoyer les tests
DELETE FROM "GEDDocument" WHERE title LIKE 'Test%';
DELETE FROM "admin_documents" WHERE title LIKE 'Test%'; 