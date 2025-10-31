-- =====================================================
-- AJOUTER RÈGLE D'ÉLIGIBILITÉ POUR LOGICIEL SOLID
-- =====================================================

-- Logiciel Solid : Éligible pour toutes les entreprises avec employés
INSERT INTO "EligibilityRules" (
    id,
    produit_id,
    produit_nom,
    rule_type,
    conditions,
    priority,
    is_active,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    pe.id,
    'Logiciel Solid',
    'simple',
    jsonb_build_object(
        'question_id', 'GENERAL_003',
        'value', 'Aucun',
        'operator', 'not_equals'
    ),
    1,
    true,
    NOW(),
    NOW()
FROM "ProduitEligible" pe
WHERE pe.nom = 'Logiciel Solid'
AND NOT EXISTS (
    SELECT 1 FROM "EligibilityRules" er 
    WHERE er.produit_nom = 'Logiciel Solid'
);

-- VÉRIFICATION
SELECT 
    pe.nom as produit,
    COUNT(er.id) as nb_regles,
    CASE 
        WHEN COUNT(er.id) = 0 THEN '❌ Aucune règle'
        ELSE '✅ ' || COUNT(er.id) || ' règle(s)'
    END as status
FROM "ProduitEligible" pe
LEFT JOIN "EligibilityRules" er ON pe.nom = er.produit_nom
WHERE pe.active = true
GROUP BY pe.nom
ORDER BY pe.nom;

