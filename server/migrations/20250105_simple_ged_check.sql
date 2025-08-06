-- ============================================================================
-- VÉRIFICATION SIMPLIFIÉE GEDDOCUMENT
-- ============================================================================

-- 1. Vérifier les contraintes de la table GEDDocument
SELECT 
    'GED_CONSTRAINTS' as check_type,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name = 'GEDDocument'
ORDER BY tc.constraint_name;

-- 2. Vérifier les valeurs uniques existantes dans GEDDocument
SELECT 
    'GED_EXISTING_VALUES' as check_type,
    'category' as column_name,
    category as value,
    COUNT(*) as count
FROM "GEDDocument" 
GROUP BY category
ORDER BY count DESC;

-- 3. Vérifier les valeurs autorisées pour category (méthode alternative)
SELECT 
    'GED_ALLOWED_VALUES' as check_type,
    'category' as column_name,
    enumlabel as allowed_value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'ged_document_category'
ORDER BY e.enumsortorder;

-- 4. Test avec une valeur autorisée (business)
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
    'Test Alignement Document',
    'Test pour vérifier l''alignement frontend-backend',
    'Contenu de test pour l''alignement',
    'business',
    '/documents/test-alignment.pdf',
    id,
    true,
    5,
    1
FROM "users"
LIMIT 1
RETURNING id, title, category, file_path, created_at;

-- 5. Nettoyer le test
DELETE FROM "GEDDocument" WHERE title = 'Test Alignement Document'; 