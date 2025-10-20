-- =====================================================
-- ANALYSE QUESTIONS SIMULATEUR
-- =====================================================

-- 1. Afficher toutes les questions avec leur question_id
SELECT 
    id,
    question_id,
    question_text,
    question_type,
    question_order,
    produits_cibles
FROM "QuestionnaireQuestion"
ORDER BY question_order;

-- 2. Identifier les questions R&D ou obsolètes
SELECT 
    id,
    question_id,
    question_text,
    question_type,
    produits_cibles
FROM "QuestionnaireQuestion"
WHERE 
    question_text ILIKE '%R&D%' 
    OR question_text ILIKE '%recherche%développement%'
    OR question_text ILIKE '%crédit%recherche%'
    OR question_id LIKE '%RD%'
ORDER BY question_order;

-- 3. Compter les questions par catégorie
SELECT 
    CASE 
        WHEN question_text ILIKE '%R&D%' THEN 'R&D'
        WHEN question_text ILIKE '%salarié%' THEN 'Salariés'
        WHEN question_text ILIKE '%chiffre%affaire%' THEN 'CA'
        ELSE 'Autre'
    END as categorie,
    COUNT(*) as count
FROM "QuestionnaireQuestion"
GROUP BY categorie;

-- 4. Vérifier les doublons
SELECT 
    question_text,
    COUNT(*) as count
FROM "QuestionnaireQuestion"
GROUP BY question_text
HAVING COUNT(*) > 1;

