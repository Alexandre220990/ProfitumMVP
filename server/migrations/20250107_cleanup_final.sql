-- =====================================================
-- NETTOYAGE FINAL ET VÉRIFICATION
-- Date: 2025-01-07
-- =====================================================

-- 1. Nettoyer les réponses temporaires qui bloquent la suppression
DELETE FROM "public"."TemporaryResponse";

-- 2. Maintenant on peut nettoyer les anciennes questions
DELETE FROM "public"."QuestionnaireQuestion" 
WHERE question_id IS NULL OR question_id = '';

-- 3. Vérifier le résultat final
SELECT 
    question_id,
    question_text,
    section,
    phase,
    produits_cibles,
    question_order
FROM "public"."QuestionnaireQuestion"
ORDER BY question_order;

-- 4. Compter les questions par section
SELECT 
    section,
    COUNT(*) as nombre_questions,
    STRING_AGG(question_id, ', ' ORDER BY question_order) as questions
FROM "public"."QuestionnaireQuestion"
GROUP BY section
ORDER BY section;

-- 5. Vérifier la logique conditionnelle TICPE
SELECT 
    question_id,
    question_text,
    conditions->>'depends_on' as depends_on,
    validation_rules->>'depends_on' as validation_depends_on
FROM "public"."QuestionnaireQuestion"
WHERE question_id LIKE 'TICPE_%'
ORDER BY question_order; 