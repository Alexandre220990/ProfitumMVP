-- ============================================================================
-- VÉRIFICATION DES COLONNES DE TOUTES LES TABLES IMPORTANTES
-- ============================================================================

-- Table simulations
SELECT 
    'simulations' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'simulations'
ORDER BY ordinal_position;

-- Table SimulationProcessed
SELECT 
    'SimulationProcessed' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'SimulationProcessed'
ORDER BY ordinal_position;

-- Table Client
SELECT 
    'Client' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'Client'
ORDER BY ordinal_position;


-- Table Expert
SELECT 
    'Expert' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'Expert'
ORDER BY ordinal_position;

-- Table Admin
SELECT 
    'Admin' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'Admin'
ORDER BY ordinal_position;

-- Table ClientProduitEligible
SELECT 
    'ClientProduitEligible' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'ClientProduitEligible'
ORDER BY ordinal_position; 