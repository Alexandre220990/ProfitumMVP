-- =====================================================
-- MISE À JOUR SECTEURS D'ACTIVITÉ - GENERAL_001
-- =====================================================

-- Mettre à jour la question GENERAL_001 avec les nouveaux secteurs
UPDATE "QuestionnaireQuestion"
SET options = '{
  "choix": [
    "Transport et Logistique",
    "Commerce et Distribution",
    "Industrie et Fabrication",
    "Services aux Entreprises",
    "BTP et Construction",
    "Restauration et Hôtellerie",
    "Santé et Services Sociaux",
    "Agriculture et Agroalimentaire",
    "Services à la Personne",
    "Autre secteur"
  ]
}'::jsonb
WHERE question_id = 'GENERAL_001';

-- Mettre à jour la règle DFS pour utiliser "Transport et Logistique"
UPDATE "EligibilityRules"
SET conditions = jsonb_set(
  conditions,
  '{rules,1,value}',
  '"Transport et Logistique"'
)
WHERE produit_nom = 'DFS';

-- VÉRIFICATION
SELECT 
    question_id,
    question_text,
    options->'choix' as secteurs_disponibles
FROM "QuestionnaireQuestion"
WHERE question_id = 'GENERAL_001';

-- Vérifier la règle DFS
SELECT 
    produit_nom,
    conditions
FROM "EligibilityRules"
WHERE produit_nom = 'DFS';

