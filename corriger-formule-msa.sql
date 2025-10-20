-- =====================================================
-- CORRECTION FORMULE MSA - RETIRER MAPPING_TRANCHES
-- =====================================================

-- La fonction mapper_reponses_vers_variables convertit déjà la tranche en valeur numérique
-- Donc la formule ne doit PAS avoir de mapping_tranches

UPDATE "ProduitEligible"
SET formule_calcul = '{
  "type": "percentage",
  "base_var": "ca",
  "rate": 0.065,
  "formula_display": "CA × 6,5%"
}'::jsonb
WHERE nom = 'MSA';

-- TEST après correction
SELECT calculer_montant_produit(
    (SELECT id FROM "ProduitEligible" WHERE nom = 'MSA'),
    '{"ca": 2500000, "ca_tranche": "1 000 000€ - 5 000 000€"}'::jsonb
) as test_msa_apres_correction;

-- Vérifier le résultat
SELECT 
    nom,
    formule_calcul
FROM "ProduitEligible"
WHERE nom = 'MSA';

