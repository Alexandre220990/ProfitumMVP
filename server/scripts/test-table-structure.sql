-- ============================================================================
-- SCRIPT DE TEST POUR VÉRIFIER LA STRUCTURE DES TABLES
-- ============================================================================

-- 1. Vérifier la structure de ClientProduitEligible
SELECT 
    'CLIENT_PRODUIT_ELIGIBLE_STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'ClientProduitEligible'
ORDER BY ordinal_position;

-- 2. Vérifier la structure de DossierStep
SELECT 
    'DOSSIER_STEP_STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'DossierStep'
ORDER BY ordinal_position;

-- 3. Vérifier la structure de ProduitEligible
SELECT 
    'PRODUIT_ELIGIBLE_STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'ProduitEligible'
ORDER BY ordinal_position;

-- 4. Vérifier la structure de Client
SELECT 
    'CLIENT_STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'Client'
ORDER BY ordinal_position;

-- 5. Test simple de sélection sur ClientProduitEligible
SELECT 
    'TEST_SELECTION' as check_type,
    id,
    "clientId",
    "produitId",
    statut,
    current_step,
    progress
FROM "ClientProduitEligible" 
LIMIT 1;

-- 6. Vérifier si le dossier problématique existe
SELECT 
    'DOSSIER_EXISTS_CHECK' as check_type,
    id,
    "clientId",
    "produitId",
    statut,
    current_step,
    progress,
    created_at
FROM "ClientProduitEligible" 
WHERE id = '93374842-cca6-4873-b16e-0ada92e97004';
