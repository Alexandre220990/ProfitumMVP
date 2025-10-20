-- ============================================================================
-- FONCTION : mapper_reponses_vers_variables
-- Transforme les réponses {question_code: valeur} en {variable: valeur}
-- ============================================================================

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
      
      WHEN 'TICPE_003' THEN
        -- Pour les choix multiples, convertir en array
        v_result := v_result || jsonb_build_object('types_vehicules', p_reponses->v_key);
      
      -- Questions de calcul
      WHEN 'CALCUL_TICPE_LITRES' THEN
        v_result := v_result || jsonb_build_object('litres_carburant_mois', (v_value)::NUMERIC);
      
      WHEN 'CALCUL_DFS_CHAUFFEURS' THEN
        v_result := v_result || jsonb_build_object('nb_chauffeurs', (v_value)::NUMERIC);
      
      WHEN 'CALCUL_FONCIER_MONTANT' THEN
        v_result := v_result || jsonb_build_object('montant_taxe_fonciere', (v_value)::NUMERIC);
      
      WHEN 'CALCUL_ENERGIE_FACTURES' THEN
        v_result := v_result || jsonb_build_object('montant_factures_energie_mois', (v_value)::NUMERIC);
      
      -- Questions recouvrement
      WHEN 'RECOUVR_001' THEN
        v_result := v_result || jsonb_build_object('niveau_impayes', v_value);
      
      ELSE
        -- Garder la clé telle quelle si non mappée
        v_result := v_result || jsonb_build_object(v_key, p_reponses->v_key);
    END CASE;
  END LOOP;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FONCTION : evaluer_eligibilite_avec_calcul_V2
-- Version améliorée avec mapping automatique des réponses
-- ============================================================================

CREATE OR REPLACE FUNCTION evaluer_eligibilite_avec_calcul(
  p_simulation_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_simulation RECORD;
  v_reponses JSONB;
  v_reponses_mappees JSONB;
  v_resultats JSONB := '[]'::jsonb;
  v_produit RECORD;
  v_calcul JSONB;
  v_eligible BOOLEAN;
BEGIN
  -- Récupérer la simulation et ses réponses
  SELECT answers INTO v_reponses
  FROM simulations
  WHERE id = p_simulation_id;

  IF v_reponses IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Simulation non trouvée ou sans réponses'
    );
  END IF;

  -- Mapper les réponses vers les variables de formules
  v_reponses_mappees := mapper_reponses_vers_variables(v_reponses);

  -- Log pour debug
  RAISE NOTICE 'Réponses originales: %', v_reponses;
  RAISE NOTICE 'Réponses mappées: %', v_reponses_mappees;

  -- Pour chaque produit actif
  FOR v_produit IN 
    SELECT id, nom, type_produit, notes_affichage
    FROM "ProduitEligible"
    WHERE active = true
  LOOP
    -- Calculer le montant avec les réponses mappées
    v_calcul := calculer_montant_produit(v_produit.id, v_reponses_mappees);
    v_eligible := (v_calcul->>'is_eligible')::BOOLEAN;

    -- Ajouter au résultat
    v_resultats := v_resultats || jsonb_build_object(
      'produit_id', v_produit.id,
      'produit_nom', v_produit.nom,
      'type_produit', v_produit.type_produit,
      'is_eligible', v_eligible,
      'montant_estime', COALESCE((v_calcul->>'montant')::NUMERIC, 0),
      'calcul_details', v_calcul->'details',
      'notes', v_produit.notes_affichage
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'simulation_id', p_simulation_id,
    'produits', v_resultats,
    'total_eligible', (
      SELECT COUNT(*) 
      FROM jsonb_array_elements(v_resultats) AS p
      WHERE (p->>'is_eligible')::BOOLEAN = true
    ),
    'reponses_mappees', v_reponses_mappees
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TESTS
-- ============================================================================

-- Test du mapping
/*
SELECT mapper_reponses_vers_variables('{
  "GENERAL_001": "Transport routier de marchandises",
  "CALCUL_TICPE_LITRES": "5000",
  "GENERAL_003": "21 à 50"
}'::jsonb);
*/

COMMENT ON FUNCTION mapper_reponses_vers_variables IS 'Transforme les codes questions en noms de variables pour les formules';
COMMENT ON FUNCTION evaluer_eligibilite_avec_calcul IS 'Évalue l''éligibilité ET calcule les montants avec mapping automatique des réponses';

