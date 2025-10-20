-- =====================================================
-- CORRECTION MAPPING RÉPONSES POUR CALCUL
-- =====================================================

CREATE OR REPLACE FUNCTION mapper_reponses_vers_variables(
  p_reponses JSONB
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB := '{}'::jsonb;
  v_key TEXT;
  v_value TEXT;
BEGIN
  -- Parcourir toutes les réponses
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_reponses)
  LOOP
    -- Mapper selon le code de question
    CASE v_key
      -- Questions générales
      WHEN 'GENERAL_001' THEN
        v_result := v_result || jsonb_build_object('secteur', v_value);
      
      WHEN 'GENERAL_002' THEN
        -- Mapper la tranche CA vers une valeur numérique pour MSA
        DECLARE
          v_ca NUMERIC;
        BEGIN
          v_ca := CASE v_value
            WHEN 'Moins de 100 000€' THEN 50000
            WHEN '100 000€ - 500 000€' THEN 300000
            WHEN '500 000€ - 1 000 000€' THEN 750000
            WHEN '1 000 000€ - 5 000 000€' THEN 2500000
            WHEN 'Plus de 5 000 000€' THEN 7000000
            ELSE 0
          END;
          v_result := v_result || jsonb_build_object('ca_tranche', v_value, 'ca', v_ca);
        END;
      
      WHEN 'GENERAL_003' THEN
        -- Mapper la tranche vers une valeur numérique pour URSSAF
        DECLARE
          v_nb_employes NUMERIC;
        BEGIN
          v_nb_employes := CASE v_value
            WHEN 'Aucun' THEN 0
            WHEN '1 à 5' THEN 3
            WHEN '6 à 20' THEN 13
            WHEN '21 à 50' THEN 35
            WHEN 'Plus de 50' THEN 75
            ELSE 0
          END;
          v_result := v_result || jsonb_build_object('nb_employes_tranche', v_value, 'nb_employes', v_nb_employes);
        END;
      
      WHEN 'GENERAL_004' THEN
        v_result := v_result || jsonb_build_object('proprietaire_locaux', v_value);
      
      WHEN 'GENERAL_005' THEN
        v_result := v_result || jsonb_build_object('contrats_energie', v_value);
      
      -- Questions TICPE
      WHEN 'TICPE_001' THEN
        v_result := v_result || jsonb_build_object('possede_vehicules', v_value);
      
      WHEN 'TICPE_003' THEN
        -- Pour les choix multiples, convertir en array
        v_result := v_result || jsonb_build_object('types_vehicules', p_reponses->v_key);
      
      -- Questions de calcul - NOUVEAUX ID
      WHEN 'TICPE_002' THEN
        v_result := v_result || jsonb_build_object('litres_carburant_mois', (v_value)::NUMERIC);
      
      WHEN 'DFS_001' THEN
        v_result := v_result || jsonb_build_object('nb_chauffeurs', (v_value)::NUMERIC);
      
      WHEN 'FONCIER_001' THEN
        v_result := v_result || jsonb_build_object('montant_taxe_fonciere', (v_value)::NUMERIC);
      
      WHEN 'ENERGIE_001' THEN
        v_result := v_result || jsonb_build_object('montant_factures_energie_mois', (v_value)::NUMERIC);
      
      -- Questions recouvrement - Mapper selon les tranches du produit
      WHEN 'RECOUVR_001' THEN
        DECLARE
          v_montant_impayes NUMERIC;
        BEGIN
          -- Le mapping du produit Recouvrement
          v_montant_impayes := CASE v_value
            WHEN 'Non' THEN 0
            WHEN 'Oui, montant faible (< 10 000€)' THEN 5000
            WHEN 'Oui, montant modéré (10 000€ - 50 000€)' THEN 30000
            WHEN 'Oui, montant important (> 50 000€)' THEN 75000
            ELSE 0
          END;
          v_result := v_result || jsonb_build_object('niveau_impayes', v_value, 'montant_impayes', v_montant_impayes);
        END;
      
      -- ANCIENS CODES (pour rétrocompatibilité)
      WHEN 'CALCUL_TICPE_LITRES' THEN
        v_result := v_result || jsonb_build_object('litres_carburant_mois', (v_value)::NUMERIC);
      
      WHEN 'CALCUL_DFS_CHAUFFEURS' THEN
        v_result := v_result || jsonb_build_object('nb_chauffeurs', (v_value)::NUMERIC);
      
      WHEN 'CALCUL_FONCIER_MONTANT' THEN
        v_result := v_result || jsonb_build_object('montant_taxe_fonciere', (v_value)::NUMERIC);
      
      WHEN 'CALCUL_ENERGIE_FACTURES' THEN
        v_result := v_result || jsonb_build_object('montant_factures_energie_mois', (v_value)::NUMERIC);
      
      ELSE
        -- Garder la clé telle quelle si non mappée
        v_result := v_result || jsonb_build_object(v_key, p_reponses->v_key);
    END CASE;
  END LOOP;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Test rapide
SELECT mapper_reponses_vers_variables('{
  "GENERAL_001": "Transport et Logistique",
  "GENERAL_002": "1 000 000€ - 5 000 000€",
  "GENERAL_003": "21 à 50",
  "TICPE_002": "10000",
  "DFS_001": "15",
  "FONCIER_001": "12000",
  "ENERGIE_001": "2000"
}'::jsonb) as reponses_mappees;

