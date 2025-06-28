-- Vérifier les types exacts des colonnes
-- Date: 2025-01-24

-- 1. Vérifier les types des colonnes de la table Client
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Client' 
AND column_name IN ('id', 'auth_id', 'clientId')
ORDER BY ordinal_position;

-- 2. Vérifier les types des colonnes de la table Simulation
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Simulation' 
AND column_name IN ('id', 'clientId')
ORDER BY ordinal_position;

-- 3. Vérifier les types des colonnes de la table ClientProduitEligible
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ClientProduitEligible' 
AND column_name IN ('id', 'clientId', 'produitId', 'simulationId')
ORDER BY ordinal_position;

-- 4. Vérifier les types des colonnes de la table ProduitEligible
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ProduitEligible' 
AND column_name IN ('id', 'nom')
ORDER BY ordinal_position; 