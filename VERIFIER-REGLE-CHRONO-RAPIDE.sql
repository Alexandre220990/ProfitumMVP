-- =====================================================
-- VÉRIFICATION RAPIDE RÈGLE CHRONOTACHYGRAPHES
-- =====================================================

-- 1. RÈGLE D'ÉLIGIBILITÉ
SELECT 
    '════════════════════════════════════════════════' as sep;
SELECT '🎯 RÈGLE D''ÉLIGIBILITÉ' as titre;

SELECT 
    produit_nom,
    rule_type,
    conditions->>'question_id' as question_id,
    conditions->>'value' as valeur_requise,
    conditions->>'operator' as operateur,
    is_active,
    priority,
    CASE 
        WHEN conditions->>'operator' = 'includes' 
         AND conditions->>'question_id' = 'TICPE_003'
         AND conditions->>'value' = 'Camions de plus de 7,5 tonnes'
        THEN '✅ Règle correcte'
        ELSE '❌ Règle incorrecte'
    END as statut
FROM "EligibilityRules"
WHERE produit_nom = 'Chronotachygraphes digitaux';

-- 2. QUESTION TICPE_003
SELECT '';
SELECT '════════════════════════════════════════════════' as sep;
SELECT '📋 QUESTION TICPE_003' as titre;

SELECT 
    question_id,
    question_order,
    question_text,
    question_type,
    options->'choix' as choix_disponibles,
    CASE 
        WHEN question_type = 'choix_multiple' 
         AND options->'choix' @> '["Camions de plus de 7,5 tonnes"]'::jsonb
        THEN '✅ Type et valeur corrects'
        ELSE '❌ Problème de type ou valeur'
    END as validation_choix,
    conditions,
    CASE 
        WHEN conditions->>'depends_on' IS NOT NULL
        THEN '✅ Question conditionnelle'
        ELSE '⚠️ Question toujours visible'
    END as validation_condition
FROM "QuestionnaireQuestion"
WHERE question_id = 'TICPE_003';

-- 3. VÉRIFICATION: VALEUR DANS LES CHOIX
SELECT '';
SELECT '════════════════════════════════════════════════' as sep;
SELECT '✅ VÉRIFICATION CROISÉE' as titre;

SELECT 
    er.produit_nom,
    er.conditions->>'value' as valeur_dans_regle,
    CASE 
        WHEN qq.options->'choix' @> to_jsonb(ARRAY[er.conditions->>'value'])
        THEN '✅ Valeur existe dans les choix de TICPE_003'
        ELSE '❌ Valeur manquante dans les choix'
    END as validation_valeur,
    CASE 
        WHEN qq.question_type = 'choix_multiple' AND er.conditions->>'operator' = 'includes'
        THEN '✅ Opérateur "includes" correct pour choix_multiple'
        ELSE '❌ Incompatibilité opérateur/type question'
    END as validation_operateur
FROM "EligibilityRules" er
INNER JOIN "QuestionnaireQuestion" qq ON qq.question_id = er.conditions->>'question_id'
WHERE er.produit_nom = 'Chronotachygraphes digitaux';

-- 4. RÉSUMÉ FINAL
SELECT '';
SELECT '════════════════════════════════════════════════' as sep;
SELECT '📊 RÉSUMÉ' as titre;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM "EligibilityRules" 
            WHERE produit_nom = 'Chronotachygraphes digitaux'
              AND conditions->>'question_id' = 'TICPE_003'
              AND conditions->>'value' = 'Camions de plus de 7,5 tonnes'
              AND conditions->>'operator' = 'includes'
              AND is_active = true
        ) THEN '✅ Règle existe et est active'
        ELSE '❌ Règle manquante ou inactive'
    END as regle,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM "QuestionnaireQuestion" 
            WHERE question_id = 'TICPE_003'
              AND question_type = 'choix_multiple'
              AND options->'choix' @> '["Camions de plus de 7,5 tonnes"]'::jsonb
        ) THEN '✅ Question TICPE_003 correctement configurée'
        ELSE '❌ Question TICPE_003 mal configurée'
    END as question,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM "ProduitEligible" 
            WHERE nom = 'Chronotachygraphes digitaux'
              AND type_produit = 'qualitatif'
              AND active = true
        ) THEN '✅ Produit qualitatif actif'
        ELSE '❌ Produit mal configuré ou inactif'
    END as produit;

