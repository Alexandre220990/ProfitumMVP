-- =====================================================
-- CORRIGER LES CONDITIONS DES QUESTIONS DE CALCUL (9-12)
-- =====================================================
-- Ces questions doivent être affichées conditionnellement

-- 1. TICPE_002 (litres carburant) - Afficher SI véhicules professionnels
UPDATE "QuestionnaireQuestion"
SET conditions = jsonb_build_object(
    'depends_on', (SELECT id FROM "QuestionnaireQuestion" WHERE question_id = 'TICPE_001'),
    'value', 'Oui',
    'operator', 'equals'
)
WHERE question_id = 'TICPE_002';

-- 2. DFS_001 (nb chauffeurs) - Afficher SI secteur Transport
UPDATE "QuestionnaireQuestion"
SET conditions = jsonb_build_object(
    'depends_on', (SELECT id FROM "QuestionnaireQuestion" WHERE question_id = 'GENERAL_001'),
    'value', 'Transport et Logistique',
    'operator', 'equals'
)
WHERE question_id = 'DFS_001';

-- 3. FONCIER_001 (taxe foncière) - Afficher SI propriétaire locaux
UPDATE "QuestionnaireQuestion"
SET conditions = jsonb_build_object(
    'depends_on', (SELECT id FROM "QuestionnaireQuestion" WHERE question_id = 'GENERAL_004'),
    'value', 'Oui',
    'operator', 'equals'
)
WHERE question_id = 'FONCIER_001';

-- 4. ENERGIE_001 (factures énergie) - Afficher SI contrats énergie
UPDATE "QuestionnaireQuestion"
SET conditions = jsonb_build_object(
    'depends_on', (SELECT id FROM "QuestionnaireQuestion" WHERE question_id = 'GENERAL_005'),
    'value', 'Oui',
    'operator', 'equals'
)
WHERE question_id = 'ENERGIE_001';

-- VÉRIFICATION
SELECT 
    question_id,
    question_text,
    question_order,
    conditions,
    CASE 
        WHEN conditions IS NULL OR conditions = '{}'::jsonb THEN '❌ Pas de conditions'
        ELSE '✅ Conditions définies'
    END as status
FROM "QuestionnaireQuestion"
WHERE question_order >= 9
ORDER BY question_order;

-- Afficher les dépendances de manière lisible
SELECT 
    qq.question_id,
    qq.question_order,
    qq.question_text,
    dep.question_id as depend_de,
    dep.question_text as depend_de_texte,
    qq.conditions->>'value' as valeur_requise,
    qq.conditions->>'operator' as operateur
FROM "QuestionnaireQuestion" qq
LEFT JOIN "QuestionnaireQuestion" dep ON dep.id = (qq.conditions->>'depends_on')::uuid
WHERE qq.question_order >= 9
ORDER BY qq.question_order;

