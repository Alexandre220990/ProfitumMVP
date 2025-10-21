-- =====================================================
-- CORRECTION : Ajouter vérification des règles avant calcul
-- =====================================================

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
  v_regle RECORD;
  v_regle_satisfaite BOOLEAN;
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

  -- Pour chaque produit actif
  FOR v_produit IN 
    SELECT id, nom, type_produit, notes_affichage
    FROM "ProduitEligible"
    WHERE active = true
  LOOP
    -- ✅ VÉRIFIER D'ABORD LES RÈGLES D'ÉLIGIBILITÉ
    v_regle_satisfaite := FALSE;
    
    -- Récupérer la règle du produit
    SELECT * INTO v_regle
    FROM "EligibilityRules"
    WHERE produit_nom = v_produit.nom
    ORDER BY priority
    LIMIT 1;
    
    -- Si pas de règle, considérer comme éligible par défaut
    IF v_regle IS NULL THEN
      v_regle_satisfaite := TRUE;
    ELSE
      -- Vérifier la règle
      IF v_regle.rule_type = 'simple' THEN
        -- Règle simple : vérifier une condition
        DECLARE
          v_question_id TEXT := v_regle.conditions->>'question_id';
          v_required_value TEXT := v_regle.conditions->>'value';
          v_operator TEXT := v_regle.conditions->>'operator';
          v_actual_value TEXT := v_reponses->>v_question_id;
        BEGIN
          v_regle_satisfaite := CASE v_operator
            WHEN 'equals' THEN v_actual_value = v_required_value
            WHEN 'not_equals' THEN v_actual_value != v_required_value
            WHEN 'includes' THEN v_reponses->v_question_id ? v_required_value
            ELSE FALSE
          END;
        END;
      ELSE
        -- Pour l'instant, on considère les règles combined comme satisfaites
        -- TODO: implémenter la logique combined
        v_regle_satisfaite := TRUE;
      END IF;
    END IF;
    
    -- ✅ SI LA RÈGLE N'EST PAS SATISFAITE, MARQUER COMME NON ÉLIGIBLE
    IF NOT v_regle_satisfaite THEN
      v_resultats := v_resultats || jsonb_build_object(
        'produit_id', v_produit.id,
        'produit_nom', v_produit.nom,
        'type_produit', v_produit.type_produit,
        'is_eligible', FALSE,
        'montant_estime', 0,
        'calcul_details', jsonb_build_object('reason', 'Règle d''éligibilité non satisfaite'),
        'notes', v_produit.notes_affichage
      );
      CONTINUE;
    END IF;
    
    -- ✅ RÈGLE SATISFAITE : Calculer le montant
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

