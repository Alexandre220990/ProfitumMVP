-- =====================================================
-- CORRECTION FORMULE URSSAF - RETIRER MAPPING_TRANCHES
-- =====================================================

-- La fonction mapper_reponses_vers_variables convertit déjà "21 à 50" → 35
-- Donc la formule ne doit PAS avoir de mapping_tranches

UPDATE "ProduitEligible"
SET formule_calcul = '{
  "type": "multiplication_sequence",
  "operations": [
    {"var": "nb_employes", "multiply": 35000},
    {"result": "masse_salariale", "multiply": 0.1}
  ],
  "formula_display": "nb_employés × 35 000€ × 10%"
}'::jsonb
WHERE nom = 'URSSAF';

-- Même correction pour TICPE et Optimisation Énergie qui semblent aussi avoir un problème
-- Vérifier leur formule actuelle
SELECT 
    nom,
    formule_calcul
FROM "ProduitEligible"
WHERE nom IN ('TICPE', 'Optimisation Énergie');

