-- =====================================================
-- VÉRIFICATION ET CORRECTION DES OPTIONS DES QUESTIONS
-- =====================================================
-- Ce script vérifie que les questions de type choix
-- ont bien leur propriété "choix" dans l'objet options

-- 1. Afficher toutes les questions de type choix avec leurs options
SELECT 
    question_order,
    question_id,
    question_text,
    question_type,
    options,
    jsonb_typeof(options) as options_type,
    options ? 'choix' as has_choix_key,
    CASE 
        WHEN options ? 'choix' THEN jsonb_array_length(options->'choix')
        ELSE 0
    END as nombre_choix
FROM "QuestionnaireQuestion"
WHERE question_type IN ('choix_unique', 'choix_multiple')
ORDER BY question_order;

-- 2. Identifier les questions de type choix sans options valides
SELECT 
    question_order,
    question_id,
    question_text,
    question_type,
    options
FROM "QuestionnaireQuestion"
WHERE question_type IN ('choix_unique', 'choix_multiple')
  AND (
    options IS NULL 
    OR NOT (options ? 'choix')
    OR jsonb_array_length(options->'choix') = 0
  )
ORDER BY question_order;

-- 3. Exemple de structure correcte attendue par le frontend
-- Les options doivent avoir cette structure :
-- {
--   "choix": ["Option 1", "Option 2", "Option 3"]
-- }

-- 4. Pour les questions de type nombre, vérifier la structure
SELECT 
    question_order,
    question_id,
    question_text,
    question_type,
    options,
    options ? 'min' as has_min,
    options ? 'max' as has_max,
    options ? 'unite' as has_unite
FROM "QuestionnaireQuestion"
WHERE question_type = 'nombre'
ORDER BY question_order;

-- 5. Exemple de correction pour une question de type choix_unique
-- (DÉCOMMENTER et adapter selon vos besoins)
/*
UPDATE "QuestionnaireQuestion"
SET options = jsonb_build_object(
    'choix', jsonb_build_array('Oui', 'Non')
)
WHERE question_id = 'VOTRE_QUESTION_ID';
*/

