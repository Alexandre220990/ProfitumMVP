-- ============================================================================
-- VÉRIFICATION ALIGNEMENT TABLE CALENDAREVENT
-- ============================================================================

-- 1. Structure de la table CalendarEvent
SELECT 
    'STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'CalendarEvent'
ORDER BY ordinal_position;

-- 2. Contraintes de la table CalendarEvent
SELECT 
    'CONSTRAINTS' as check_type,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
    AND tc.table_name = 'CalendarEvent'
ORDER BY tc.constraint_name;

-- 3. Données d'exemple dans CalendarEvent
SELECT 
    'SAMPLE_DATA' as check_type,
    id,
    title,
    type,
    priority,
    status,
    category,
    client_id,
    expert_id,
    start_date,
    end_date,
    created_at
FROM "CalendarEvent" 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Vérifier les valeurs uniques pour les colonnes importantes
SELECT 
    'UNIQUE_VALUES' as check_type,
    'type' as column_name,
    type as value,
    COUNT(*) as count
FROM "CalendarEvent" 
GROUP BY type

UNION ALL

SELECT 
    'UNIQUE_VALUES' as check_type,
    'priority' as column_name,
    priority as value,
    COUNT(*) as count
FROM "CalendarEvent" 
GROUP BY priority

UNION ALL

SELECT 
    'UNIQUE_VALUES' as check_type,
    'status' as column_name,
    status as value,
    COUNT(*) as count
FROM "CalendarEvent" 
GROUP BY status

UNION ALL

SELECT 
    'UNIQUE_VALUES' as check_type,
    'category' as column_name,
    category as value,
    COUNT(*) as count
FROM "CalendarEvent" 
GROUP BY category

ORDER BY column_name, count DESC; 