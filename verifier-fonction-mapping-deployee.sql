-- =====================================================
-- VÉRIFIER SI LA FONCTION mapper_reponses_vers_variables EST DÉPLOYÉE
-- =====================================================

-- 1. Vérifier que la fonction existe
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name = 'mapper_reponses_vers_variables';

-- 2. Tester la fonction directement
SELECT mapper_reponses_vers_variables('{
  "GENERAL_001": "Transport et Logistique",
  "GENERAL_002": "1 000 000€ - 5 000 000€",
  "GENERAL_003": "21 à 50",
  "GENERAL_004": "Oui",
  "GENERAL_005": "Oui",
  "TICPE_001": "Oui",
  "TICPE_002": "10000",
  "DFS_001": "15",
  "FONCIER_001": "12000",
  "ENERGIE_001": "2000",
  "RECOUVR_001": "Non"
}'::jsonb) as test_mapping;

