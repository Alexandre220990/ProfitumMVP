-- ============================================================================
-- SCRIPT NETTOYAGE : Suppression données test expert
-- Expert ID: 2678526c-488f-45a1-818a-f9ce48882d26
-- ============================================================================

-- Supprimer les RDV de test
DELETE FROM "RDV"
WHERE expert_id = '2678526c-488f-45a1-818a-f9ce48882d26';

-- Supprimer les CPE de test
DELETE FROM "ClientProduitEligible"
WHERE expert_id = '2678526c-488f-45a1-818a-f9ce48882d26';

-- Vérification après nettoyage
SELECT 
    'RDV' as table_name,
    COUNT(*) as restants
FROM "RDV"
WHERE expert_id = '2678526c-488f-45a1-818a-f9ce48882d26'
UNION ALL
SELECT 
    'ClientProduitEligible' as table_name,
    COUNT(*) as restants
FROM "ClientProduitEligible"
WHERE expert_id = '2678526c-488f-45a1-818a-f9ce48882d26';

