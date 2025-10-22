-- =====================================================
-- VÉRIFICATION STRUCTURE DES QUESTIONS
-- =====================================================
-- Ce script vérifie que les questions du simulateur
-- ont les bonnes colonnes et options configurées

-- 1. Vérifier les colonnes disponibles dans QuestionnaireQuestion
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'QuestionnaireQuestion'
ORDER BY ordinal_position;

-- 2. Vérifier les types de questions existants
SELECT 
    question_type,
    COUNT(*) as nombre
FROM "QuestionnaireQuestion"
GROUP BY question_type
ORDER BY nombre DESC;

-- 3. Afficher les 5 premières questions avec leurs détails
SELECT 
    question_order,
    question_id,
    question_text,
    question_type,
    options,
    section,
    importance,
    conditions
FROM "QuestionnaireQuestion"
ORDER BY question_order
LIMIT 5;

-- 4. Vérifier les questions de type choix qui n'ont pas d'options
SELECT 
    question_order,
    question_id,
    question_text,
    question_type,
    options
FROM "QuestionnaireQuestion"
WHERE (question_type ILIKE '%choix%' OR question_type ILIKE '%choice%')
  AND (options IS NULL OR options::text = '{}' OR options::text = 'null')
ORDER BY question_order;

-- 5. Afficher toutes les questions avec leur structure complète
SELECT 
    question_order,
    question_id,
    question_text,
    question_type,
    COALESCE(options::text, 'NULL') as options_json,
    section,
    produits_cibles
FROM "QuestionnaireQuestion"
ORDER BY question_order;

