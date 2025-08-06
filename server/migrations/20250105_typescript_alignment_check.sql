-- ============================================================================
-- VÉRIFICATION ALIGNEMENT INTERFACES TYPESCRIPT
-- ============================================================================

-- 1. Vérifier l'alignement CalendarEvent
SELECT 
    'TYPESCRIPT_CALENDAR_CHECK' as check_type,
    'CalendarEvent' as interface_name,
    'type' as field_name,
    'appointment,deadline,meeting,task,reminder' as expected_values,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM "CalendarEvent" 
            WHERE type IN ('appointment', 'deadline', 'meeting', 'task', 'reminder')
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status

UNION ALL

SELECT 
    'TYPESCRIPT_CALENDAR_CHECK' as check_type,
    'CalendarEvent' as interface_name,
    'priority' as field_name,
    'low,medium,high,critical' as expected_values,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM "CalendarEvent" 
            WHERE priority IN ('low', 'medium', 'high', 'critical')
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status

UNION ALL

SELECT 
    'TYPESCRIPT_CALENDAR_CHECK' as check_type,
    'CalendarEvent' as interface_name,
    'status' as field_name,
    'pending,confirmed,cancelled,completed' as expected_values,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM "CalendarEvent" 
            WHERE status IN ('pending', 'confirmed', 'cancelled', 'completed')
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status;

-- 2. Vérifier l'alignement Document
SELECT 
    'TYPESCRIPT_DOCUMENT_CHECK' as check_type,
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

-- 3. Vérifier l'alignement SimulationProcessed
SELECT 
    'TYPESCRIPT_SIMULATION_CHECK' as check_type,
    'SimulationProcessed' as interface_name,
    'createdat' as field_name,
    'timestamp' as expected_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'SimulationProcessed' 
            AND column_name = 'createdat'
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status

UNION ALL

SELECT 
    'TYPESCRIPT_SIMULATION_CHECK' as check_type,
    'SimulationProcessed' as interface_name,
    'updatedat' as field_name,
    'timestamp' as expected_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'SimulationProcessed' 
            AND column_name = 'updatedat'
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status;

-- 4. Vérifier les colonnes camelCase vs snake_case dans les interfaces
SELECT 
    'TYPESCRIPT_NAMING_CHECK' as check_type,
    table_name,
    column_name,
    CASE 
        WHEN column_name ~ '[A-Z]' AND column_name != UPPER(column_name) THEN '⚠️ CAMELCASE'
        WHEN column_name ~ '_' THEN '✅ SNAKE_CASE'
        WHEN column_name = LOWER(column_name) THEN '✅ LOWERCASE'
        ELSE '❓ AUTRE'
    END as naming_convention,
    CASE 
        WHEN table_name IN ('ClientProduitEligible', 'Audit', 'Dossier') AND column_name ~ '[A-Z]' THEN '✅ ATTENDU'
        WHEN table_name NOT IN ('ClientProduitEligible', 'Audit', 'Dossier') AND column_name ~ '_' THEN '✅ ATTENDU'
        ELSE '⚠️ INCONSISTANT'
    END as consistency_status
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN (
        'Client', 'Expert', 'Admin', 'CalendarEvent', 'simulations', 
        'SimulationProcessed', 'ClientProduitEligible', 'GEDDocument',
        'admin_documents', 'Audit', 'Dossier'
    )
    AND column_name NOT IN ('id', 'created_at', 'updated_at')
ORDER BY table_name, column_name; 