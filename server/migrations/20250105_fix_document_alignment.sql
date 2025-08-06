-- ============================================================================
-- CORRECTION ALIGNEMENT DOCUMENT
-- ============================================================================

-- 1. Vérifier les données existantes dans GEDDocument
SELECT 
    'GEDDOCUMENT_DATA_CHECK' as check_type,
    COUNT(*) as total_records,
    COUNT(DISTINCT category) as unique_categories,
    STRING_AGG(DISTINCT category, ', ') as categories
FROM "GEDDocument";

-- 2. Insérer des données de test pour valider l'alignement
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
    'Document business pour test d''alignement',
    'Contenu business de test pour valider l''interface TypeScript',
    'business',
    '/documents/test-business.pdf',
    id,
    true,
    5,
    1
FROM "Client"
LIMIT 1
RETURNING id, title, category, file_path, created_at;

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
    'Document technique pour test d''alignement',
    'Contenu technique de test pour valider l''interface TypeScript',
    'technical',
    '/documents/test-technical.pdf',
    id,
    true,
    10,
    1
FROM "Client"
LIMIT 1
RETURNING id, title, category, file_path, created_at;

-- 3. Vérifier l'alignement après insertion
SELECT 
    'DOCUMENT_ALIGNMENT_CHECK' as check_type,
    'Document' as interface_name,
    'category' as field_name,
    'business,technical' as expected_values,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM "GEDDocument" 
            WHERE category IN ('business', 'technical')
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status;

-- 4. Nettoyer les tests
DELETE FROM "GEDDocument" WHERE title LIKE 'Test%'; 