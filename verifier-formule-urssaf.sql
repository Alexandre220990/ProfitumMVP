-- =====================================================
-- VÉRIFIER FORMULE URSSAF COMPLÈTE
-- =====================================================

SELECT 
    nom,
    formule_calcul,
    parametres_requis
FROM "ProduitEligible"
WHERE nom = 'URSSAF';

-- Tester le calcul URSSAF directement avec bonnes réponses
SELECT calculer_montant_produit(
    (SELECT id FROM "ProduitEligible" WHERE nom = 'URSSAF'),
    '{"nb_employes": 35, "nb_employes_tranche": "21 à 50"}'::jsonb
) as test_urssaf;

-- Tester MSA aussi
SELECT calculer_montant_produit(
    (SELECT id FROM "ProduitEligible" WHERE nom = 'MSA'),
    '{"ca": 2500000, "ca_tranche": "1 000 000€ - 5 000 000€"}'::jsonb
) as test_msa;

