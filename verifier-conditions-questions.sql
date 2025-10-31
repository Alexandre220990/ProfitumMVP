-- =====================================================
-- VÉRIFIER LES CONDITIONS DES QUESTIONS 9-12
-- =====================================================

SELECT 
    question_id,
    question_text,
    question_order,
    question_type,
    conditions,
    CASE 
        WHEN conditions IS NULL THEN '❌ NULL'
        WHEN conditions = '{}'::jsonb THEN '❌ Objet vide'
        WHEN jsonb_typeof(conditions) = 'object' AND jsonb_object_keys(conditions) IS NULL THEN '❌ Objet vide'
        ELSE '✅ A des conditions'
    END as status_conditions
FROM "QuestionnaireQuestion"
WHERE question_order >= 9
ORDER BY question_order;

-- Afficher les détails des conditions
SELECT 
    question_id,
    question_order,
    conditions,
    conditions->>'depends_on' as depend_de_question,
    conditions->>'value' as valeur_requise,
    conditions->>'operator' as operateur
FROM "QuestionnaireQuestion"
WHERE question_order >= 9
ORDER BY question_order;

