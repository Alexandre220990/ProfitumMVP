-- ============================================================================
-- VÉRIFICATION DES COLONNES CLIENT DANS TOUTES LES TABLES
-- ============================================================================

-- Trouver toutes les tables qui ont des colonnes contenant "client"
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND c.column_name ILIKE '%client%'
ORDER BY t.table_name, c.column_name;

-- Vérifier spécifiquement les tables importantes
SELECT 
    'simulations' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'simulations'
    AND column_name ILIKE '%client%'

UNION ALL

SELECT 
    'SimulationProcessed' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'SimulationProcessed'
    AND column_name ILIKE '%client%'

UNION ALL

SELECT 
    'ClientProduitEligible' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'ClientProduitEligible'
    AND column_name ILIKE '%client%'

UNION ALL

SELECT 
    'Audit' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'Audit'
    AND column_name ILIKE '%client%'

UNION ALL

SELECT 
    'CalendarEvent' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'CalendarEvent'
    AND column_name ILIKE '%client%'

ORDER BY table_name, column_name; 