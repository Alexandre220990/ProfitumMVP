-- =====================================================
-- VÉRIFIER TRIGGERS ET CONTRAINTES CPE
-- =====================================================

-- 1. Lister tous les triggers sur ClientProduitEligible
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'ClientProduitEligible';

-- 2. Lister toutes les contraintes UNIQUE
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'ClientProduitEligible'
  AND constraint_type IN ('UNIQUE', 'CHECK');

-- 3. Vérifier s'il existe déjà des CPE pour ce client/produit
SELECT 
    COUNT(*) as nb_existants,
    clientId,
    produitId
FROM "ClientProduitEligible"
WHERE clientId = '70728b93-899d-4e60-9c45-bdcd20aa2013'
  AND produitId IN (
    SELECT id FROM "ProduitEligible" WHERE nom IN ('FONCIER', 'URSSAF', 'TICPE')
  )
GROUP BY clientId, produitId;

-- 4. Tester une insertion manuelle directe
INSERT INTO "ClientProduitEligible" (
    clientId,
    produitId,
    statut,
    montantFinal
) VALUES (
    '70728b93-899d-4e60-9c45-bdcd20aa2013',
    (SELECT id FROM "ProduitEligible" WHERE nom = 'FONCIER' LIMIT 1),
    'eligible',
    4000
)
RETURNING id, clientId, produitId, montantFinal;

