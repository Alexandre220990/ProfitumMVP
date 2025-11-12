-- =====================================================================
-- Mise à jour de la fonction mapper_reponses_vers_variables
-- Objectif :
--   - Gérer les nouvelles questions énergie (séparées gaz / électricité)
--   - Éviter les erreurs de cast NUMERIC sur les réponses Oui/Non
--   - Conserver la compatibilité avec les anciens champs
-- =====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION mapper_reponses_vers_variables(
  p_reponses JSONB
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB := '{}'::jsonb;
  v_key TEXT;
  v_value TEXT;
  v_has_gaz BOOLEAN := false;
  v_has_elec BOOLEAN := false;
  v_gaz_amount NUMERIC := 0;
  v_elec_amount NUMERIC := 0;
  v_total_energy NUMERIC := 0;
  v_existing_energy NUMERIC := 0;
BEGIN
  IF p_reponses IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_reponses)
  LOOP
    CASE v_key
      -- Questions générales (tranches)
      WHEN 'GENERAL_001' THEN
        v_result := v_result || jsonb_build_object('secteur', v_value);

      WHEN 'GENERAL_002' THEN
        v_result := v_result || jsonb_build_object('ca_tranche', v_value);

      WHEN 'GENERAL_003' THEN
        v_result := v_result || jsonb_build_object('nb_employes_tranche', v_value);

      WHEN 'GENERAL_004' THEN
        v_result := v_result || jsonb_build_object('proprietaire_locaux', v_value);

      WHEN 'GENERAL_005' THEN
        v_result := v_result || jsonb_build_object('contrats_energie', v_value);

      -- Questions TICPE
      WHEN 'TICPE_001' THEN
        v_result := v_result || jsonb_build_object('possede_vehicules', v_value);

      WHEN 'TICPE_002' THEN
        BEGIN
          v_result := v_result || jsonb_build_object('litres_carburant_mois', (NULLIF(v_value, ''))::NUMERIC);
        EXCEPTION WHEN invalid_text_representation THEN
          v_result := v_result || jsonb_build_object('litres_carburant_mois', 0);
        END;

      WHEN 'TICPE_003' THEN
        v_result := v_result || jsonb_build_object('types_vehicules', p_reponses->v_key);

      -- Questions DFS
      WHEN 'DFS_001' THEN
        BEGIN
          v_result := v_result || jsonb_build_object('nb_chauffeurs', (NULLIF(v_value, ''))::NUMERIC);
        EXCEPTION WHEN invalid_text_representation THEN
          v_result := v_result || jsonb_build_object('nb_chauffeurs', 0);
        END;

      -- Questions foncier
      WHEN 'FONCIER_001' THEN
        BEGIN
          v_result := v_result || jsonb_build_object('montant_taxe_fonciere', (NULLIF(v_value, ''))::NUMERIC);
        EXCEPTION WHEN invalid_text_representation THEN
          v_result := v_result || jsonb_build_object('montant_taxe_fonciere', 0);
        END;

      -- Ancienne question énergie unique
      WHEN 'CALCUL_ENERGIE_FACTURES' THEN
        BEGIN
          v_result := v_result || jsonb_build_object('montant_factures_energie_mois', (NULLIF(v_value, ''))::NUMERIC);
        EXCEPTION WHEN invalid_text_representation THEN
          v_result := v_result || jsonb_build_object('montant_factures_energie_mois', 0);
        END;

      -- Nouvelles questions énergie (flags Oui/Non)
      WHEN 'ENERGIE_GAZ_FACTURES' THEN
        v_has_gaz := lower(coalesce(v_value, '')) IN ('oui', 'yes', 'true', '1');
        v_result := v_result || jsonb_build_object('ENERGIE_GAZ_FACTURES', CASE WHEN v_has_gaz THEN 1 ELSE 0 END);

      WHEN 'ENERGIE_ELEC_FACTURES' THEN
        v_has_elec := lower(coalesce(v_value, '')) IN ('oui', 'yes', 'true', '1');
        v_result := v_result || jsonb_build_object('ENERGIE_ELEC_FACTURES', CASE WHEN v_has_elec THEN 1 ELSE 0 END);

      -- Nouvelles questions énergie (montants)
      WHEN 'ENERGIE_GAZ_MONTANT' THEN
        BEGIN
          v_gaz_amount := COALESCE(NULLIF(v_value, '')::NUMERIC, 0);
        EXCEPTION WHEN invalid_text_representation THEN
          v_gaz_amount := 0;
        END;
        v_result := v_result || jsonb_build_object('montant_factures_gaz_mois', v_gaz_amount);

      WHEN 'ENERGIE_ELEC_MONTANT' THEN
        BEGIN
          v_elec_amount := COALESCE(NULLIF(v_value, '')::NUMERIC, 0);
        EXCEPTION WHEN invalid_text_representation THEN
          v_elec_amount := 0;
        END;
        v_result := v_result || jsonb_build_object('montant_factures_elec_mois', v_elec_amount);

      -- Questions recouvrement
      WHEN 'RECOUVR_001' THEN
        v_result := v_result || jsonb_build_object('niveau_impayes', v_value);

      ELSE
        -- Garder la valeur d'origine (JSON) pour les autres questions
        v_result := v_result || jsonb_build_object(v_key, p_reponses->v_key);
    END CASE;
  END LOOP;

  -- Compatibilité descendante : récupérer d'éventuelles valeurs legacy
  IF NOT v_has_gaz THEN
    v_has_gaz := lower(coalesce(p_reponses->>'general_energie_gaz', '')) IN ('oui', 'yes', 'true', '1');
  END IF;

  IF v_gaz_amount = 0 THEN
    BEGIN
      v_gaz_amount := COALESCE(NULLIF(p_reponses->>'energie_gaz_montant', '')::NUMERIC, 0);
    EXCEPTION WHEN invalid_text_representation THEN
      v_gaz_amount := 0;
    END;
  END IF;

  IF NOT v_has_elec THEN
    v_has_elec := lower(coalesce(p_reponses->>'general_energie_elec', '')) IN ('oui', 'yes', 'true', '1');
  END IF;

  IF v_elec_amount = 0 THEN
    BEGIN
      v_elec_amount := COALESCE(NULLIF(p_reponses->>'energie_elec_montant', '')::NUMERIC, 0);
    EXCEPTION WHEN invalid_text_representation THEN
      v_elec_amount := 0;
    END;
  END IF;

  -- Additionner les montants (gaz + électricité) et préserver l'existant
  IF v_result ? 'montant_factures_energie_mois' THEN
    BEGIN
      v_existing_energy := COALESCE((v_result->>'montant_factures_energie_mois')::NUMERIC, 0);
    EXCEPTION WHEN invalid_text_representation THEN
      v_existing_energy := 0;
    END;
  END IF;

  v_total_energy := v_existing_energy;

  IF v_has_gaz OR v_gaz_amount > 0 THEN
    v_total_energy := v_total_energy + COALESCE(v_gaz_amount, 0);
    v_result := v_result || jsonb_build_object('montant_factures_gaz_mois', COALESCE(v_gaz_amount, 0));
  END IF;

  IF v_has_elec OR v_elec_amount > 0 THEN
    v_total_energy := v_total_energy + COALESCE(v_elec_amount, 0);
    v_result := v_result || jsonb_build_object('montant_factures_elec_mois', COALESCE(v_elec_amount, 0));
  END IF;

  v_result := v_result || jsonb_build_object('montant_factures_energie_mois', v_total_energy);

  IF NOT (v_result ? 'contrats_energie') THEN
    IF v_has_gaz OR v_has_elec THEN
      v_result := v_result || jsonb_build_object('contrats_energie', 'Oui');
    ELSE
      v_result := v_result || jsonb_build_object('contrats_energie', 'Non');
    END IF;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- =====================================================================
-- FIN DU SCRIPT
-- =====================================================================

