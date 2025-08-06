-- ============================================================================
-- MISE À JOUR INTERFACE DOCUMENT AVEC VALEURS AUTORISÉES
-- ============================================================================

-- 1. Identifier les valeurs autorisées pour category
SELECT 
    'CATEGORY_VALUES' as check_type,
    'GEDDocument' as table_name,
    'category' as column_name,
    enumlabel as allowed_value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'ged_document_category'
ORDER BY e.enumsortorder;

-- 2. Vérifier les contraintes pour status si elles existent
SELECT 
    'STATUS_CONSTRAINTS' as check_type,
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name = 'GEDDocument'
    AND constraint_name LIKE '%status%'
ORDER BY constraint_name;

-- 3. Vérifier les contraintes pour is_active
SELECT 
    'ACTIVE_CONSTRAINTS' as check_type,
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.table_name = 'GEDDocument'
    AND constraint_name LIKE '%active%'
ORDER BY constraint_name;

-- 4. Résumé des contraintes pour l'interface TypeScript
SELECT 
    'INTERFACE_RECOMMENDATIONS' as check_type,
    'category' as field_name,
    'enum' as field_type,
    'Utiliser les valeurs autorisées ci-dessus' as recommendation,
    'HIGH' as priority

UNION ALL

SELECT 
    'INTERFACE_RECOMMENDATIONS' as check_type,
    'is_active' as field_name,
    'boolean' as field_type,
    'Valeur par défaut: true' as recommendation,
    'MEDIUM' as priority

UNION ALL

SELECT 
    'INTERFACE_RECOMMENDATIONS' as check_type,
    'read_time' as field_name,
    'number' as field_type,
    'Valeur par défaut: 5' as recommendation,
    'MEDIUM' as priority

UNION ALL

SELECT 
    'INTERFACE_RECOMMENDATIONS' as check_type,
    'version' as field_name,
    'number' as field_type,
    'Valeur par défaut: 1' as recommendation,
    'MEDIUM' as priority; 