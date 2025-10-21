-- =====================================================
-- VÉRIFIER RÈGLE MSA
-- =====================================================

-- Voir la règle actuelle
SELECT 
    produit_nom,
    rule_type,
    conditions,
    priority
FROM "EligibilityRules"
WHERE produit_nom = 'MSA';

-- Vérifier si elle check le secteur
SELECT 
    conditions->>'question_id' as question_checked,
    conditions->>'value' as required_value,
    conditions->>'operator' as operator_used
FROM "EligibilityRules"
WHERE produit_nom = 'MSA';

