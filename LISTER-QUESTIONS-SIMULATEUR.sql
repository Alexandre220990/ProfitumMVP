-- =====================================================
-- LISTE COMPLÈTE DES QUESTIONS DU SIMULATEUR
-- =====================================================
-- Pour analyser quelles questions doivent passer en "nombre exact"
-- =====================================================

SELECT 
    question_order as "N°",
    question_id as "Code",
    question_text as "Question",
    question_type as "Type Actuel",
    CASE 
        WHEN question_type = 'choix_unique' THEN 
            options->'choix'
        WHEN question_type = 'choix_multiple' THEN 
            options->'choix'
        WHEN question_type = 'nombre' THEN 
            json_build_object(
                'min', options->'min',
                'max', options->'max',
                'unite', options->'unite'
            )::text
        ELSE 'N/A'
    END as "Options Actuelles",
    CASE 
        WHEN conditions IS NULL OR conditions = '{}'::jsonb THEN 'Toujours affichée'
        ELSE 'Conditionnelle: ' || (conditions->>'depends_on')
    END as "Affichage",
    produits_cibles as "Produits Concernés"
FROM "QuestionnaireQuestion"
ORDER BY question_order;

-- =====================================================
-- STATISTIQUES PAR TYPE
-- =====================================================

SELECT 
    question_type as "Type de Question",
    COUNT(*) as "Nombre",
    string_agg(question_id, ', ' ORDER BY question_order) as "Codes Questions"
FROM "QuestionnaireQuestion"
GROUP BY question_type
ORDER BY COUNT(*) DESC;

-- =====================================================
-- FOCUS: Questions avec TRANCHES (à convertir ?)
-- =====================================================

SELECT 
    question_order as "N°",
    question_id as "Code",
    question_text as "Question",
    options->'choix' as "Tranches Actuelles"
FROM "QuestionnaireQuestion"
WHERE question_type = 'choix_unique'
  AND (
      options->'choix' @> '["Moins de 100 000€"]'::jsonb
      OR options->'choix' @> '["1 à 5"]'::jsonb
      OR question_text ILIKE '%combien%'
      OR question_text ILIKE '%nombre%'
      OR question_text ILIKE '%montant%'
  )
ORDER BY question_order;

-- =====================================================
-- FOCUS: Questions déjà en NOMBRE EXACT
-- =====================================================

SELECT 
    question_order as "N°",
    question_id as "Code",
    question_text as "Question",
    options->'min' as "Min",
    options->'max' as "Max",
    options->'unite' as "Unité"
FROM "QuestionnaireQuestion"
WHERE question_type = 'nombre'
ORDER BY question_order;

-- =====================================================
-- EXPORT FORMAT LISIBLE POUR DÉCISION
-- =====================================================

SELECT 
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' as "═══════════════════════════════";

SELECT 
    CONCAT(
        'Q', question_order, ' | ',
        question_id, ' | ',
        CASE question_type
            WHEN 'choix_unique' THEN '📋 TRANCHE'
            WHEN 'choix_multiple' THEN '☑️  MULTI'
            WHEN 'nombre' THEN '🔢 NOMBRE'
            WHEN 'texte' THEN '📝 TEXTE'
        END
    ) as "Question",
    question_text as "Texte",
    CASE 
        WHEN question_type IN ('choix_unique', 'choix_multiple') THEN
            jsonb_array_length(options->'choix')::text || ' options'
        WHEN question_type = 'nombre' THEN
            CONCAT('Min:', options->'min', ' Max:', options->'max', ' ', options->'unite')
        ELSE 'Texte libre'
    END as "Configuration"
FROM "QuestionnaireQuestion"
ORDER BY question_order;

