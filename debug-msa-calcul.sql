-- =====================================================
-- DEBUG MSA
-- =====================================================

-- Vérifier la formule MSA
SELECT 
    nom,
    formule_calcul->'mapping_tranches' as has_mapping,
    formule_calcul->>'base_var' as base_var,
    formule_calcul->>'rate' as rate
FROM "ProduitEligible"
WHERE nom = 'MSA';

-- Tester avec différentes variantes
SELECT calculer_montant_produit(
    (SELECT id FROM "ProduitEligible" WHERE nom = 'MSA'),
    '{"ca": 2500000}'::jsonb
) as test_avec_ca_direct;

SELECT calculer_montant_produit(
    (SELECT id FROM "ProduitEligible" WHERE nom = 'MSA'),
    '{"ca_tranche": "1 000 000€ - 5 000 000€"}'::jsonb
) as test_avec_tranche_seule;

-- Test avec mapping complet
SELECT calculer_montant_produit(
    (SELECT id FROM "ProduitEligible" WHERE nom = 'MSA'),
    '{"ca": 2500000, "ca_tranche": "1 000 000€ - 5 000 000€", "secteur": "Agriculture et Agroalimentaire"}'::jsonb
) as test_complet;

