-- =====================================================
-- ROLLBACK ET REFAIRE LES CONDITIONS CORRECTEMENT
-- =====================================================
-- Ce script annule les mauvaises conditions (avec question_id au lieu d'UUID)
-- et les refait correctement avec les UUID

BEGIN;

-- ============================================================================
-- ÉTAPE 1: SUPPRIMER LES CONDITIONS INCORRECTES
-- ============================================================================

UPDATE "QuestionnaireQuestion"
SET conditions = NULL
WHERE question_id IN ('TICPE_002', 'DFS_001', 'FONCIER_001', 'ENERGIE_001');

-- Vérification
SELECT 
    question_id,
    question_text,
    conditions
FROM "QuestionnaireQuestion"
WHERE question_id IN ('TICPE_002', 'DFS_001', 'FONCIER_001', 'ENERGIE_001');

-- ============================================================================
-- ÉTAPE 2: RECRÉER LES CONDITIONS AVEC LES UUID (CORRECT)
-- ============================================================================

-- TICPE_002 (litres carburant) - Afficher SI TICPE_001 = "Oui"
UPDATE "QuestionnaireQuestion"
SET conditions = jsonb_build_object(
    'depends_on', (SELECT id::text FROM "QuestionnaireQuestion" WHERE question_id = 'TICPE_001'),
    'value', 'Oui',
    'operator', 'equals'
)
WHERE question_id = 'TICPE_002';

-- DFS_001 (nb chauffeurs) - Afficher SI GENERAL_001 = "Transport et Logistique"
UPDATE "QuestionnaireQuestion"
SET conditions = jsonb_build_object(
    'depends_on', (SELECT id::text FROM "QuestionnaireQuestion" WHERE question_id = 'GENERAL_001'),
    'value', 'Transport et Logistique',
    'operator', 'equals'
)
WHERE question_id = 'DFS_001';

-- FONCIER_001 (taxe foncière) - Afficher SI GENERAL_004 = "Oui"
UPDATE "QuestionnaireQuestion"
SET conditions = jsonb_build_object(
    'depends_on', (SELECT id::text FROM "QuestionnaireQuestion" WHERE question_id = 'GENERAL_004'),
    'value', 'Oui',
    'operator', 'equals'
)
WHERE question_id = 'FONCIER_001';

-- ENERGIE_001 (factures énergie) - Afficher SI GENERAL_005 = "Oui"
UPDATE "QuestionnaireQuestion"
SET conditions = jsonb_build_object(
    'depends_on', (SELECT id::text FROM "QuestionnaireQuestion" WHERE question_id = 'GENERAL_005'),
    'value', 'Oui',
    'operator', 'equals'
)
WHERE question_id = 'ENERGIE_001';

-- ============================================================================
-- VÉRIFICATION FINALE - FORMAT CORRECT
-- ============================================================================

SELECT 
    '=== VÉRIFICATION: CONDITIONS AVEC UUID ===' as titre;

SELECT 
    qq.question_id,
    qq.question_order,
    qq.question_text,
    qq.conditions,
    qq.conditions->>'depends_on' as uuid_parente,
    dep.question_id as question_id_parente,
    dep.question_text as texte_parente,
    qq.conditions->>'value' as valeur_requise,
    qq.conditions->>'operator' as operateur,
    CASE 
        WHEN qq.conditions IS NULL THEN '❌ Pas de conditions'
        WHEN qq.conditions->>'depends_on' IS NULL THEN '❌ depends_on manquant'
        WHEN LENGTH(qq.conditions->>'depends_on') < 30 THEN '❌ depends_on trop court (pas un UUID)'
        WHEN dep.id IS NULL THEN '❌ UUID invalide (question parente introuvable)'
        ELSE '✅ Format correct (UUID)'
    END as statut
FROM "QuestionnaireQuestion" qq
LEFT JOIN "QuestionnaireQuestion" dep 
    ON dep.id = (qq.conditions->>'depends_on')::uuid
WHERE qq.question_id IN ('TICPE_002', 'DFS_001', 'FONCIER_001', 'ENERGIE_001')
ORDER BY qq.question_order;

COMMIT;

-- ============================================================================
-- AIDE: AFFICHER LES UUID DES QUESTIONS PARENTES
-- ============================================================================

SELECT 
    '=== AIDE: UUID DES QUESTIONS PARENTES ===' as titre;

SELECT 
    question_id,
    id as uuid,
    question_text
FROM "QuestionnaireQuestion"
WHERE question_id IN ('TICPE_001', 'GENERAL_001', 'GENERAL_004', 'GENERAL_005')
ORDER BY question_order;

