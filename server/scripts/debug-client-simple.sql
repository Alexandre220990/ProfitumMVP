-- =====================================================
-- DEBUG CLIENT SIMPLIFIÉ - TEST UNE REQUÊTE À LA FOIS
-- Client ID: 546a07b3-564e-4838-aaa4-96128ebca448
-- Date: 2025-01-30
-- =====================================================

-- Test 0: Vérifier l'existence et la structure de la table SimulatorSession
SELECT 
    'Structure SimulatorSession' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'SimulatorSession' 
ORDER BY ordinal_position;

-- Test 1: Vérifier le client spécifique
SELECT 
    'Client spécifique' as section,
    id,
    email,
    name,
    company_name,
    auth_id,
    statut,
    created_at
FROM "Client"
WHERE id = '546a07b3-564e-4838-aaa4-96128ebca448';

-- Test 2: Vérifier les produits éligibles de ce client
SELECT 
    'Produits éligibles du client' as section,
    cpe.id,
    cpe."clientId",
    cpe."produitId",
    cpe.statut,
    cpe."tauxFinal",
    cpe."montantFinal",
    cpe.created_at,
    pe.nom as produit_nom
FROM "ClientProduitEligible" cpe
LEFT JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
WHERE cpe."clientId" = '546a07b3-564e-4838-aaa4-96128ebca448'
ORDER BY cpe.created_at DESC;

-- Test 3: Vérifier les sessions de simulateur pour cet email (seulement si la table existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'SimulatorSession') THEN
        -- La table existe, on peut faire la requête
        RAISE NOTICE 'Table SimulatorSession existe, exécution de la requête...';
    ELSE
        RAISE NOTICE 'Table SimulatorSession n''existe pas encore';
    END IF;
END $$;

-- Test 3: Vérifier les sessions de simulateur pour cet email
SELECT 
    'Sessions simulateur' as section,
    id,
    session_token,
    status,
    current_step,
    total_steps,
    created_at,
    updated_at
FROM "SimulatorSession"
WHERE metadata::text LIKE '%test2@test.fr%'
ORDER BY created_at DESC;

-- Test 4: Vérifier les résultats d'éligibilité du simulateur
SELECT 
    'Résultats éligibilité simulateur' as section,
    id,
    session_id,
    produit_id,
    eligibility_score,
    estimated_savings,
    confidence_level,
    created_at
FROM "SimulatorEligibility"
WHERE session_id IN (
    SELECT id 
    FROM "SimulatorSession" 
    WHERE metadata::text LIKE '%test2@test.fr%'
)
ORDER BY created_at DESC; 