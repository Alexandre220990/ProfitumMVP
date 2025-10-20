-- =====================================================
-- CORRECTION RÈGLES D'ÉLIGIBILITÉ
-- =====================================================

-- 1. SUPPRIMER la règle TVA
DELETE FROM "EligibilityRules"
WHERE produit_nom = 'TVA';

-- 2. SUPPRIMER les règles pour produits obsolètes
DELETE FROM "EligibilityRules"
WHERE produit_nom IN ('Chronotachygraphes digitaux', 'Optimisation Énergie', 'MSA');

-- 3. CORRIGER "Foncier" → "FONCIER"
UPDATE "EligibilityRules"
SET produit_nom = 'FONCIER'
WHERE produit_nom = 'Foncier';

-- 4. CORRIGER la règle CEE qui référence CIR (maintenant supprimé)
-- La règle CEE devient simple : juste vérifier GENERAL_005
UPDATE "EligibilityRules"
SET 
    rule_type = 'simple',
    conditions = '{"value":"Oui","operator":"equals","question_id":"GENERAL_005"}'::jsonb,
    priority = 1
WHERE id = '3878e1f5-feb9-4157-8051-a53be3974a80';

-- 5. SUPPRIMER le doublon CEE (on garde qu'une seule règle)
DELETE FROM "EligibilityRules"
WHERE id = 'ebcfa604-3624-4713-a00c-f30a2854abdd'; -- Ancien CEE simple

-- 6. VÉRIFICATION FINALE : Lister toutes les règles
SELECT 
    produit_nom,
    rule_type,
    conditions,
    priority
FROM "EligibilityRules"
ORDER BY produit_nom, priority;

-- 7. Vérifier que toutes les règles référencent des question_id valides
SELECT 
    er.produit_nom,
    er.conditions->>'question_id' as question_id,
    qq.question_id as exists,
    CASE 
        WHEN qq.question_id IS NULL THEN '❌ MANQUANT'
        ELSE '✅ OK'
    END as status
FROM "EligibilityRules" er
LEFT JOIN "QuestionnaireQuestion" qq 
    ON er.conditions->>'question_id' = qq.question_id
WHERE er.conditions->>'question_id' IS NOT NULL
ORDER BY er.produit_nom;

-- 8. Compter les règles par produit
SELECT 
    produit_nom,
    COUNT(*) as nb_regles
FROM "EligibilityRules"
GROUP BY produit_nom
ORDER BY produit_nom;

