-- =====================================================
-- SUPPRIMER LE DOUBLON - RÈGLE LOGICIEL SOLID
-- =====================================================

BEGIN;

-- Supprimer TOUTES les règles Logiciel Solid
DELETE FROM "EligibilityRules"
WHERE produit_nom = 'Logiciel Solid';

-- Recréer UNE SEULE règle
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
        'question_id', 'GENERAL_001',
        'value', 'Transport et Logistique',
        'operator', 'equals'
    ),
    1,
    true,
    NOW(),
    NOW()
FROM "ProduitEligible" pe
WHERE pe.nom = 'Logiciel Solid';

-- Vérification
SELECT 
    produit_nom,
    rule_type,
    conditions->>'question_id' as question_id,
    conditions->>'value' as valeur_requise,
    conditions->>'operator' as operateur,
    is_active,
    COUNT(*) OVER (PARTITION BY produit_nom) as nb_regles_produit,
    CASE 
        WHEN COUNT(*) OVER (PARTITION BY produit_nom) = 1 
        THEN '✅ Une seule règle'
        ELSE '❌ Encore des doublons'
    END as statut
FROM "EligibilityRules"
WHERE produit_nom = 'Logiciel Solid';

-- Résumé de toutes les règles par produit
SELECT 
    produit_nom,
    COUNT(*) as nb_regles,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ OK'
        WHEN COUNT(*) > 1 THEN '⚠️ ' || COUNT(*) || ' règles (doublons?)'
        ELSE '❌ Aucune règle'
    END as statut
FROM "EligibilityRules"
WHERE is_active = true
GROUP BY produit_nom
ORDER BY produit_nom;

COMMIT;

