-- =====================================================
-- TESTER INSERTION CLIENTPRODUITELIGIBLE DIRECTE
-- =====================================================

-- 1. Récupérer un client et un produit existants
SELECT 
    c.id as client_id,
    c.email,
    p.id as produit_id,
    p.nom as produit_nom
FROM "Client" c
CROSS JOIN "ProduitEligible" p
WHERE c.type = 'temporaire'
  AND p.nom = 'FONCIER'
LIMIT 1;

-- 2. Test d'insertion simple (remplace les IDs par ceux ci-dessus)
-- INSERT INTO "ClientProduitEligible" (
--     clientId,
--     produitId,
--     statut,
--     montantFinal
-- ) VALUES (
--     '94c9dde4-4815-4eef-8ffd-1554d35431ce',  -- client_id de la dernière session
--     'c5d2e980-4f63-44c0-b8a9-9d6e8e21c0f7',  -- FONCIER
--     'eligible',
--     2400
-- );

-- 3. Vérifier les contraintes FK
SELECT 
    (SELECT COUNT(*) FROM "Client" WHERE id = '94c9dde4-4815-4eef-8ffd-1554d35431ce') as client_exists,
    (SELECT COUNT(*) FROM "ProduitEligible" WHERE id = 'c5d2e980-4f63-44c0-b8a9-9d6e8e21c0f7') as produit_exists;

