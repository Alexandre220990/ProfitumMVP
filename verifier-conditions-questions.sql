-- =====================================================
-- VÉRIFIER CONDITIONS DES QUESTIONS
-- =====================================================

-- Afficher toutes les questions avec leurs conditions
SELECT 
    question_order,
    question_id,
    question_text,
    question_type,
    conditions
FROM "QuestionnaireQuestion"
ORDER BY question_order;

-- Vérifier si des questions ont des conditions qui les rendent invisibles
SELECT 
    question_order,
    question_id,
    question_text,
    conditions->'depends_on' as depends_on,
    conditions->'value' as required_value
FROM "QuestionnaireQuestion"
WHERE conditions IS NOT NULL 
  AND conditions != '{}'::jsonb
ORDER BY question_order;

