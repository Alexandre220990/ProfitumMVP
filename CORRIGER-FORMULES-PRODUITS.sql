-- ============================================================================
-- CORRECTIONS FINALES DES FORMULES PRODUITS
-- ============================================================================

-- 1. CORRIGER RECOUVREMENT : base_var doit être niveau_impayes (pas montant_impayes)
UPDATE "ProduitEligible"
SET 
  formule_calcul = '{
    "type": "percentage",
    "base_var": "niveau_impayes",
    "rate": 1.00,
    "formula_display": "montant_impayés × 100%",
    "mapping_tranches": {
      "Non": 0,
      "Oui, montant faible (< 10 000€)": 5000,
      "Oui, montant modéré (10 000€ - 50 000€)": 30000,
      "Oui, montant important (> 50 000€)": 75000
    }
  }'::jsonb
WHERE nom = 'Recouvrement';

-- 2. VÉRIFIER URSSAF : base_var doit être nb_employes (pas ca)
UPDATE "ProduitEligible"
SET 
  formule_calcul = '{
    "type": "multiplication_sequence",
    "operations": [
      {"var": "nb_employes", "multiply": 35000},
      {"result": "masse_salariale", "multiply": 0.10}
    ],
    "formula_display": "nb_employés × 35 000€ × 10%",
    "mapping_tranches": {
      "Aucun": 0,
      "1 à 5": 3,
      "6 à 20": 13,
      "21 à 50": 35,
      "Plus de 50": 75
    }
  }'::jsonb
WHERE nom = 'URSSAF';

-- 3. VÉRIFIER MSA : base_var doit être ca (pas ca_tranche directement)
-- La formule est correcte, pas de changement nécessaire

-- 4. VÉRIFICATION FINALE
SELECT 
  nom,
  formule_calcul->'base_var' as base_var,
  formule_calcul->'operations'->0->'var' as var_operation,
  parametres_requis
FROM "ProduitEligible"
WHERE active = true
  AND type_produit = 'financier'
ORDER BY nom;

