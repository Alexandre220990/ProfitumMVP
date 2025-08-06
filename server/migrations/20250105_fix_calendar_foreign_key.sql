-- ============================================================================
-- CORRECTION CLÉ ÉTRANGÈRE CALENDAREVENT.CREATED_BY
-- ============================================================================

-- 1. Vérifier la contrainte problématique
SELECT 
    'PROBLEMATIC_FK_CHECK' as check_type,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'CalendarEvent'
    AND kcu.column_name = 'created_by';

-- 2. Supprimer la contrainte orpheline
ALTER TABLE "CalendarEvent" DROP CONSTRAINT IF EXISTS "CalendarEvent_created_by_fkey";

-- 3. Recréer la contrainte avec Client
ALTER TABLE "CalendarEvent" 
ADD CONSTRAINT "CalendarEvent_created_by_fkey" 
FOREIGN KEY (created_by) REFERENCES "Client"(id);

-- 4. Vérifier la correction
SELECT 
    'FIXED_FK_CHECK' as check_type,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '✅ CORRIGÉ' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'CalendarEvent'
    AND kcu.column_name = 'created_by'; 