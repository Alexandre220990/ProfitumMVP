-- ============================================================================
-- VÉRIFICATION COMPLÈTE ALIGNEMENT FRONT-API-BASE
-- ============================================================================

-- 1. VÉRIFICATION DES INTERFACES TYPESCRIPT vs BASE DE DONNÉES

-- CalendarEvent Interface
SELECT 
    'CALENDAR_INTERFACE_CHECK' as check_type,
    'CalendarEvent' as interface_name,
    'type' as field_name,
    'appointment,deadline,meeting,task,reminder' as expected_values,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.check_constraints cc
            JOIN information_schema.table_constraints tc ON cc.constraint_name = tc.constraint_name
            WHERE tc.table_name = 'CalendarEvent' 
            AND cc.check_clause LIKE '%appointment%'
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status

UNION ALL

SELECT 
    'CALENDAR_INTERFACE_CHECK' as check_type,
    'CalendarEvent' as interface_name,
    'priority' as field_name,
    'low,medium,high,critical' as expected_values,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.check_constraints cc
            JOIN information_schema.table_constraints tc ON cc.constraint_name = tc.constraint_name
            WHERE tc.table_name = 'CalendarEvent' 
            AND cc.check_clause LIKE '%critical%'
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status

UNION ALL

SELECT 
    'CALENDAR_INTERFACE_CHECK' as check_type,
    'CalendarEvent' as interface_name,
    'status' as field_name,
    'pending,confirmed,cancelled,completed' as expected_values,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.check_constraints cc
            JOIN information_schema.table_constraints tc ON cc.constraint_name = tc.constraint_name
            WHERE tc.table_name = 'CalendarEvent' 
            AND cc.check_clause LIKE '%completed%'
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status;

-- Document Interface
SELECT 
    'DOCUMENT_INTERFACE_CHECK' as check_type,
    'Document' as interface_name,
    'category' as field_name,
    'business,technical' as expected_values,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.check_constraints cc
            JOIN information_schema.table_constraints tc ON cc.constraint_name = tc.constraint_name
            WHERE tc.table_name = 'GEDDocument' 
            AND cc.check_clause LIKE '%business%'
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status;

-- SimulationProcessed Interface
SELECT 
    'SIMULATION_INTERFACE_CHECK' as check_type,
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
    'SIMULATION_INTERFACE_CHECK' as check_type,
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

-- 2. VÉRIFICATION DES API ROUTES vs BASE DE DONNÉES

-- Calendar API Routes
SELECT 
    'CALENDAR_API_CHECK' as check_type,
    'POST /api/calendar/events' as route,
    'CalendarEvent' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'CalendarEvent' 
            AND column_name IN ('title', 'description', 'start_date', 'end_date', 'type', 'priority', 'status')
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status;

-- Simulations API Routes
SELECT 
    'SIMULATIONS_API_CHECK' as check_type,
    'POST /api/simulations' as route,
    'simulations' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'simulations' 
            AND column_name IN ('client_id', 'type', 'status', 'answers')
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status

UNION ALL

SELECT 
    'SIMULATIONS_API_CHECK' as check_type,
    'GET /api/simulations/check-recent/:clientId' as route,
    'simulations' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'simulations' 
            AND column_name IN ('client_id', 'created_at', 'status')
        ) THEN '✅ ALIGNÉ'
        ELSE '❌ NON ALIGNÉ'
    END as alignment_status;

-- 3. VÉRIFICATION DES COLONNES CRITIQUES

-- Foreign Keys
SELECT 
    'FOREIGN_KEYS_CHECK' as check_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN ccu.table_name IS NOT NULL THEN '✅ VALIDE'
        ELSE '❌ ORPHELINE'
    END as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('CalendarEvent', 'simulations', 'SimulationProcessed', 'GEDDocument')
ORDER BY tc.table_name, kcu.column_name;

-- 4. VÉRIFICATION DES DONNÉES DE TEST

-- Test CalendarEvent
SELECT 
    'CALENDAR_DATA_CHECK' as check_type,
    COUNT(*) as total_events,
    COUNT(DISTINCT type) as unique_types,
    COUNT(DISTINCT priority) as unique_priorities,
    COUNT(DISTINCT status) as unique_statuses,
    STRING_AGG(DISTINCT type, ', ') as types,
    STRING_AGG(DISTINCT priority, ', ') as priorities,
    STRING_AGG(DISTINCT status, ', ') as statuses
FROM "CalendarEvent";

-- Test Document
SELECT 
    'DOCUMENT_DATA_CHECK' as check_type,
    COUNT(*) as total_documents,
    COUNT(DISTINCT category) as unique_categories,
    STRING_AGG(DISTINCT category, ', ') as categories
FROM "GEDDocument";

-- Test Simulations
SELECT 
    'SIMULATIONS_DATA_CHECK' as check_type,
    COUNT(*) as total_simulations,
    COUNT(DISTINCT type) as unique_types,
    COUNT(DISTINCT status) as unique_statuses,
    STRING_AGG(DISTINCT type, ', ') as types,
    STRING_AGG(DISTINCT status, ', ') as statuses
FROM simulations;

-- 5. VÉRIFICATION DES CONVENTIONS DE NOMMAGE

SELECT 
    'NAMING_CONVENTIONS_CHECK' as check_type,
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
    AND table_name IN ('CalendarEvent', 'simulations', 'SimulationProcessed', 'GEDDocument', 'Client', 'Expert')
    AND column_name NOT IN ('id', 'created_at', 'updated_at')
ORDER BY table_name, column_name; 