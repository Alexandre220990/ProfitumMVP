-- =====================================================
-- CRÉATION RÈGLES POUR PRODUITS MANQUANTS
-- =====================================================

-- 1. MSA : 6,5% du CA pour entreprises agricoles
INSERT INTO "EligibilityRules" (
    id,
    produit_id,
    produit_nom,
    rule_type,
    conditions,
    priority,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    pe.id,
    'MSA',
    'simple',
    '{"value":"Agriculture et Agroalimentaire","operator":"equals","question_id":"GENERAL_001"}'::jsonb,
    1,
    NOW(),
    NOW()
FROM "ProduitEligible" pe
WHERE pe.nom = 'MSA';

-- 2. Chronotachygraphes digitaux : qualitatif, éligible si camions +7,5t
INSERT INTO "EligibilityRules" (
    id,
    produit_id,
    produit_nom,
    rule_type,
    conditions,
    priority,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    pe.id,
    'Chronotachygraphes digitaux',
    'simple',
    '{"value":"Camions de plus de 7,5 tonnes","operator":"includes","question_id":"TICPE_003"}'::jsonb,
    1,
    NOW(),
    NOW()
FROM "ProduitEligible" pe
WHERE pe.nom = 'Chronotachygraphes digitaux';

-- 3. Optimisation Énergie : 30% récupérable sur factures énergie
INSERT INTO "EligibilityRules" (
    id,
    produit_id,
    produit_nom,
    rule_type,
    conditions,
    priority,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    pe.id,
    'Optimisation Énergie',
    'simple',
    '{"value":"Oui","operator":"equals","question_id":"GENERAL_005"}'::jsonb,
    1,
    NOW(),
    NOW()
FROM "ProduitEligible" pe
WHERE pe.nom = 'Optimisation Énergie';

-- 4. VÉRIFICATION : Tous les produits actifs ont maintenant des règles
SELECT 
    pe.nom,
    pe.active,
    COUNT(er.id) as nb_regles,
    CASE 
        WHEN COUNT(er.id) = 0 THEN '❌ Aucune règle'
        WHEN pe.active = false THEN '⚠️ Inactif'
        ELSE '✅ OK'
    END as status
FROM "ProduitEligible" pe
LEFT JOIN "EligibilityRules" er ON pe.nom = er.produit_nom
WHERE pe.active = true
GROUP BY pe.nom, pe.active
ORDER BY pe.nom;

