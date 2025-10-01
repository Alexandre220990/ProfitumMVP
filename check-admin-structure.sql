-- ============================================================================
-- VÉRIFICATION STRUCTURE TABLE ADMIN
-- ============================================================================
-- À copier-coller dans Supabase SQL Editor
-- ============================================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'Admin'
ORDER BY 
    ordinal_position;

