-- =====================================================
-- VÉRIFICATION RÈGLES D'ÉLIGIBILITÉ
-- =====================================================

-- 1. Afficher toutes les règles avec leurs conditions
SELECT 
    id,
    produit_nom,
    rule_type,
    conditions,
    priority
FROM "EligibilityRules"
ORDER BY produit_nom, priority;

-- 2. Vérifier que les question_id des règles existent dans QuestionnaireQuestion
SELECT 
    er.produit_nom,
    er.conditions->>'question_id' as question_id_in_rule,
    qq.question_id as question_id_exists,
    qq.question_text,
    CASE 
        WHEN qq.question_id IS NULL THEN '❌ MANQUANT'
        ELSE '✅ OK'
    END as status
FROM "EligibilityRules" er
LEFT JOIN "QuestionnaireQuestion" qq 
    ON er.conditions->>'question_id' = qq.question_id
WHERE er.conditions->>'question_id' IS NOT NULL
ORDER BY er.produit_nom;

-- 3. Lister les question_id utilisés dans les règles
SELECT DISTINCT
    conditions->>'question_id' as question_id,
    COUNT(*) as nb_regles
FROM "EligibilityRules"
WHERE conditions->>'question_id' IS NOT NULL
GROUP BY question_id
ORDER BY question_id;

-- 4. Trouver les règles qui référencent des questions obsolètes
SELECT 
    produit_nom,
    conditions->>'question_id' as question_id,
    conditions
FROM "EligibilityRules"
WHERE conditions->>'question_id' LIKE '%CIR%'
   OR conditions->>'question_id' LIKE '%RD%'
   OR conditions->>'question_id' LIKE '%TVA%';

