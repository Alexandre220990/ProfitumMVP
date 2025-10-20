-- ============================================================================
-- FONCTIONS SQL - CALCUL DES MONTANTS PAR PRODUIT
-- ============================================================================

-- FONCTION PRINCIPALE : calculer_montant_produit
-- Calcule le montant d'économie pour un produit selon sa formule
-- ============================================================================

CREATE OR REPLACE FUNCTION calculer_montant_produit(
  p_produit_id UUID,
  p_reponses JSONB
) RETURNS JSONB AS $$
DECLARE
  v_produit RECORD;
  v_formule JSONB;
  v_type TEXT;
  v_resultat NUMERIC := 0;
  v_details JSONB := '{}'::jsonb;
  v_is_eligible BOOLEAN := false;
BEGIN
  -- Récupérer le produit et sa formule
  SELECT 
    nom, 
    type_produit, 
    formule_calcul,
    parametres_requis
  INTO v_produit
  FROM "ProduitEligible"
  WHERE id = p_produit_id AND active = true;

  -- Si produit non trouvé ou inactif
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Produit non trouvé ou inactif',
      'montant', 0
    );
  END IF;

  -- Si pas de formule définie
  IF v_produit.formule_calcul IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Formule de calcul non définie',
      'montant', 0
    );
  END IF;

  v_formule := v_produit.formule_calcul;
  v_type := v_formule->>'type';

  -- Calculer selon le type de formule
  CASE v_type
    -- Type 1 : Multiplication séquentielle
    WHEN 'multiplication_sequence' THEN
      SELECT * INTO v_resultat, v_details, v_is_eligible
      FROM calculer_multiplication_sequence(v_formule, p_reponses);

    -- Type 2 : Pourcentage simple
    WHEN 'percentage' THEN
      SELECT * INTO v_resultat, v_details, v_is_eligible
      FROM calculer_percentage(v_formule, p_reponses);

    -- Type 3 : Qualitatif (pas de montant)
    WHEN 'qualitatif' THEN
      RETURN jsonb_build_object(
        'success', true,
        'type', 'qualitatif',
        'montant', NULL,
        'benefits', v_formule->'benefits',
        'is_eligible', true
      );

    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Type de formule inconnu: ' || v_type,
        'montant', 0
      );
  END CASE;

  -- Retourner le résultat
  RETURN jsonb_build_object(
    'success', true,
    'type', 'financier',
    'montant', ROUND(v_resultat, 2),
    'is_eligible', v_is_eligible,
    'details', v_details,
    'produit_nom', v_produit.nom
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'montant', 0
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FONCTION HELPER : calculer_multiplication_sequence
-- Pour formules du type : var1 × constante1 × constante2
-- ============================================================================

CREATE OR REPLACE FUNCTION calculer_multiplication_sequence(
  p_formule JSONB,
  p_reponses JSONB
) RETURNS TABLE(resultat NUMERIC, details JSONB, is_eligible BOOLEAN) AS $$
DECLARE
  v_operations JSONB;
  v_operation JSONB;
  v_valeur NUMERIC := 0;
  v_var_name TEXT;
  v_multiply NUMERIC;
  v_result_name TEXT;
  v_temp NUMERIC;
  v_details JSONB := '{}'::jsonb;
  v_mapping JSONB;
  v_tranche TEXT;
BEGIN
  v_operations := p_formule->'operations';
  
  -- Récupérer le mapping de tranches si disponible
  v_mapping := p_formule->'mapping_tranches';
  
  -- Parcourir les opérations
  FOR v_operation IN SELECT * FROM jsonb_array_elements(v_operations)
  LOOP
    v_var_name := v_operation->>'var';
    v_result_name := v_operation->>'result';
    v_multiply := (v_operation->>'multiply')::NUMERIC;

    -- Si c'est une variable source
    IF v_var_name IS NOT NULL THEN
      -- Si mapping de tranches disponible, essayer plusieurs variantes de nom
      IF v_mapping IS NOT NULL THEN
        -- Essayer d'abord le nom exact
        v_tranche := p_reponses->>v_var_name;
        
        -- Si null, essayer avec _tranche
        IF v_tranche IS NULL THEN
          v_tranche := p_reponses->>(v_var_name || '_tranche');
        END IF;
        
        v_temp := COALESCE((v_mapping->>v_tranche)::NUMERIC, 0);
      ELSE
        -- Récupérer la valeur numérique directement
        v_temp := COALESCE((p_reponses->>v_var_name)::NUMERIC, 0);
      END IF;

      -- Première opération
      IF v_valeur = 0 THEN
        v_valeur := v_temp;
      END IF;
      
      v_details := v_details || jsonb_build_object(v_var_name, v_temp);
    END IF;

    -- Appliquer la multiplication
    IF v_multiply IS NOT NULL THEN
      v_valeur := v_valeur * v_multiply;
      
      IF v_result_name IS NOT NULL THEN
        v_details := v_details || jsonb_build_object(v_result_name, v_valeur);
      END IF;
    END IF;
  END LOOP;

  resultat := v_valeur;
  details := v_details;
  is_eligible := (v_valeur > 0);
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FONCTION HELPER : calculer_percentage
-- Pour formules du type : base × taux%
-- ============================================================================

CREATE OR REPLACE FUNCTION calculer_percentage(
  p_formule JSONB,
  p_reponses JSONB
) RETURNS TABLE(resultat NUMERIC, details JSONB, is_eligible BOOLEAN) AS $$
DECLARE
  v_base_var TEXT;
  v_rate NUMERIC;
  v_base_value NUMERIC := 0;
  v_mapping JSONB;
  v_tranche TEXT;
  v_details JSONB := '{}'::jsonb;
BEGIN
  v_base_var := p_formule->>'base_var';
  v_rate := (p_formule->>'rate')::NUMERIC;
  v_mapping := p_formule->'mapping_tranches';
  
  -- Essayer d'abord le nom exact
  v_tranche := p_reponses->>v_base_var;
  
  -- Si null, essayer avec _tranche
  IF v_tranche IS NULL THEN
    v_tranche := p_reponses->>(v_base_var || '_tranche');
  END IF;
  
  -- Si mapping de tranches disponible
  IF v_mapping IS NOT NULL AND v_tranche IS NOT NULL THEN
    v_base_value := COALESCE((v_mapping->>v_tranche)::NUMERIC, 0);
  ELSE
    -- Essayer de convertir en numérique directement (si pas de mapping ou pas de tranche trouvée)
    BEGIN
      v_base_value := COALESCE((p_reponses->>v_base_var)::NUMERIC, 0);
    EXCEPTION WHEN OTHERS THEN
      v_base_value := 0;
    END;
  END IF;

  -- Calculer le pourcentage
  resultat := v_base_value * v_rate;
  
  details := jsonb_build_object(
    'base_var', v_base_var,
    'base_value', v_base_value,
    'rate', v_rate,
    'resultat', resultat
  );
  
  is_eligible := (v_base_value > 0);
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FONCTION : calculer_tous_produits
-- Calcule l'éligibilité et les montants pour tous les produits actifs
-- ============================================================================

CREATE OR REPLACE FUNCTION calculer_tous_produits(
  p_reponses JSONB
) RETURNS TABLE(
  produit_id UUID,
  produit_nom TEXT,
  type_produit VARCHAR(20),
  is_eligible BOOLEAN,
  montant_estime NUMERIC,
  calcul_details JSONB,
  notes_affichage TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.nom,
    p.type_produit,
    (calculer_montant_produit(p.id, p_reponses)->>'is_eligible')::BOOLEAN,
    COALESCE((calculer_montant_produit(p.id, p_reponses)->>'montant')::NUMERIC, 0),
    calculer_montant_produit(p.id, p_reponses)->'details',
    p.notes_affichage
  FROM "ProduitEligible" p
  WHERE p.active = true
  ORDER BY p.nom;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FONCTION : evaluer_eligibilite_avec_calcul
-- Combine l'évaluation des règles ET le calcul des montants
-- ============================================================================

CREATE OR REPLACE FUNCTION evaluer_eligibilite_avec_calcul(
  p_simulation_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_simulation RECORD;
  v_reponses JSONB;
  v_resultats JSONB := '[]'::jsonb;
  v_produit RECORD;
  v_calcul JSONB;
  v_eligible BOOLEAN;
BEGIN
  -- Récupérer la simulation et ses réponses
  SELECT answers INTO v_reponses
  FROM simulations
  WHERE id = p_simulation_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Simulation non trouvée'
    );
  END IF;

  -- Pour chaque produit actif
  FOR v_produit IN 
    SELECT id, nom, type_produit, notes_affichage
    FROM "ProduitEligible"
    WHERE active = true
  LOOP
    -- Calculer le montant
    v_calcul := calculer_montant_produit(v_produit.id, v_reponses);
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
    )
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TESTS ET EXEMPLES D'UTILISATION
-- ============================================================================

-- Test 1 : Calculer un produit spécifique (TICPE)
/*
SELECT calculer_montant_produit(
  '32dd9cf8-15e2-4375-86ab-a95158d3ada1'::uuid, -- ID TICPE
  '{
    "litres_carburant_mois": 5000
  }'::jsonb
);
*/

-- Test 2 : Calculer tous les produits
/*
SELECT * FROM calculer_tous_produits('{
  "secteur": "Transport routier de marchandises",
  "litres_carburant_mois": 5000,
  "nb_employes_tranche": "21 à 50"
}'::jsonb);
*/

-- Test 3 : Évaluer une simulation complète
/*
SELECT evaluer_eligibilite_avec_calcul('votre-simulation-id'::uuid);
*/

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON FUNCTION calculer_montant_produit IS 'Calcule le montant d''économie pour un produit selon sa formule stockée en BDD';
COMMENT ON FUNCTION calculer_multiplication_sequence IS 'Helper pour formules de type multiplication séquentielle';
COMMENT ON FUNCTION calculer_percentage IS 'Helper pour formules de type pourcentage';
COMMENT ON FUNCTION calculer_tous_produits IS 'Calcule les montants pour tous les produits actifs';
COMMENT ON FUNCTION evaluer_eligibilite_avec_calcul IS 'Évalue l''éligibilité ET calcule les montants pour une simulation';

