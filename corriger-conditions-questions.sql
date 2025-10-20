-- =====================================================
-- CORRECTION CONDITIONS DES QUESTIONS
-- =====================================================

-- Question 9 : TICPE_002 - Corriger depends_on Q6 → TICPE_001
UPDATE "QuestionnaireQuestion"
SET conditions = '{
  "depends_on": "TICPE_001",
  "value": "Oui",
  "operator": "equals"
}'::jsonb
WHERE question_id = 'TICPE_002';

-- Question 10 : DFS_001 - Corriger depends_on Q1 → GENERAL_001 + valeur
UPDATE "QuestionnaireQuestion"
SET conditions = '{
  "depends_on": "GENERAL_001",
  "value": "Transport et Logistique",
  "operator": "equals"
}'::jsonb
WHERE question_id = 'DFS_001';

-- Question 11 : FONCIER_001 - Corriger depends_on Q4 → GENERAL_004
UPDATE "QuestionnaireQuestion"
SET conditions = '{
  "depends_on": "GENERAL_004",
  "value": "Oui",
  "operator": "equals"
}'::jsonb
WHERE question_id = 'FONCIER_001';

-- Question 12 : ENERGIE_001 - Corriger depends_on Q5 → GENERAL_005
UPDATE "QuestionnaireQuestion"
SET conditions = '{
  "depends_on": "GENERAL_005",
  "value": "Oui",
  "operator": "equals"
}'::jsonb
WHERE question_id = 'ENERGIE_001';

-- Question 7 : TICPE_003 - Format uniforme (déjà bon mais on standardise)
UPDATE "QuestionnaireQuestion"
SET conditions = '{
  "depends_on": "TICPE_001",
  "value": "Oui",
  "operator": "equals"
}'::jsonb
WHERE question_id = 'TICPE_003';

-- VÉRIFICATION FINALE
SELECT 
    question_order,
    question_id,
    question_text,
    conditions
FROM "QuestionnaireQuestion"
WHERE question_order >= 7
ORDER BY question_order;

