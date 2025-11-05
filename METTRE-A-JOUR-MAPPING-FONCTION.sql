-- =====================================================
-- MISE À JOUR : Fonction de Mapping des Réponses
-- =====================================================
-- Adapter le mapping pour les nouvelles questions en NOMBRE
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
        -- ✅ NOUVEAU : CA en nombre exact (pas de tranche)
        v_result := v_result || jsonb_build_object('ca_annuel', (v_value)::NUMERIC);
      
      WHEN 'GENERAL_003' THEN
        -- ✅ NOUVEAU : Nombre d'employés exact (pas de tranche)
        v_result := v_result || jsonb_build_object('nb_employes', (v_value)::NUMERIC);
      
      WHEN 'GENERAL_004' THEN
        v_result := v_result || jsonb_build_object('proprietaire_locaux', v_value);
      
      WHEN 'GENERAL_005' THEN
        v_result := v_result || jsonb_build_object('contrats_energie', v_value);
      
      WHEN 'GENERAL_006' THEN
        -- ✅ NOUVEAU : Nombre de contentieux
        v_result := v_result || jsonb_build_object('nb_contentieux', (v_value)::NUMERIC);
      
      -- Questions TICPE
      WHEN 'TICPE_001' THEN
        v_result := v_result || jsonb_build_object('possede_vehicules', v_value);
      
      WHEN 'TICPE_002' THEN
        v_result := v_result || jsonb_build_object('litres_carburant_mois', (v_value)::NUMERIC);
      
      WHEN 'TICPE_003' THEN
        -- Pour les choix multiples, convertir en array
        v_result := v_result || jsonb_build_object('types_vehicules', p_reponses->v_key);
      
      -- Questions DFS
      WHEN 'DFS_001' THEN
        v_result := v_result || jsonb_build_object('nb_chauffeurs', (v_value)::NUMERIC);
      
      -- Questions FONCIER
      WHEN 'FONCIER_001' THEN
        v_result := v_result || jsonb_build_object('montant_taxe_fonciere', (v_value)::NUMERIC);
      
      -- Questions ÉNERGIE
      WHEN 'ENERGIE_001' THEN
        v_result := v_result || jsonb_build_object('montant_factures_energie_mois', (v_value)::NUMERIC);
      
      -- Questions RECOUVREMENT
      WHEN 'RECOUVR_001' THEN
        -- ✅ NOUVEAU : Montant des impayés exact
        v_result := v_result || jsonb_build_object('montant_impayes', (v_value)::NUMERIC);
      
      ELSE
        -- Pour toute autre question, on la stocke telle quelle
        v_result := v_result || jsonb_build_object(v_key, v_value);
    END CASE;
  END LOOP;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- TEST DE LA FONCTION
-- =====================================================

SELECT mapper_reponses_vers_variables('{
  "GENERAL_001": "Transport et Logistique",
  "GENERAL_002": "250000",
  "GENERAL_003": "25",
  "GENERAL_004": "Oui",
  "GENERAL_005": "Oui",
  "GENERAL_006": "0",
  "TICPE_001": "Oui",
  "TICPE_002": "5000",
  "TICPE_003": ["Camions de plus de 7,5 tonnes"],
  "DFS_001": "3",
  "FONCIER_001": "10000",
  "ENERGIE_001": "2000",
  "RECOUVR_001": "0"
}'::jsonb) as variables_mappees;

-- =====================================================
-- RÉSULTAT ATTENDU :
-- =====================================================
-- {
--   "secteur": "Transport et Logistique",
--   "ca_annuel": 250000,
--   "nb_employes": 25,
--   "proprietaire_locaux": "Oui",
--   "contrats_energie": "Oui",
--   "nb_contentieux": 0,
--   "possede_vehicules": "Oui",
--   "litres_carburant_mois": 5000,
--   "types_vehicules": ["Camions de plus de 7,5 tonnes"],
--   "nb_chauffeurs": 3,
--   "montant_taxe_fonciere": 10000,
--   "montant_factures_energie_mois": 2000,
--   "montant_impayes": 0
-- }
-- =====================================================

