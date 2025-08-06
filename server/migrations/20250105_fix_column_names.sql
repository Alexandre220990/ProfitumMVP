-- ============================================================================
-- CORRECTION DES NOMS DE COLONNES
-- ============================================================================

-- Vérifier les colonnes actuelles de la table simulations
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'simulations'
ORDER BY ordinal_position;

-- Vérifier les colonnes actuelles de la table SimulationProcessed
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'SimulationProcessed'
ORDER BY ordinal_position;

-- Vérifier les colonnes actuelles de la table ClientProduitEligible
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'ClientProduitEligible'
ORDER BY ordinal_position;

-- Vérifier les colonnes actuelles de la table Audit
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'Audit'
ORDER BY ordinal_position; 