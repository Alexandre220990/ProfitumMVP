-- =====================================================
-- CORRIGER CONDITION TICPE_003
-- =====================================================
-- TICPE_003 (types de véhicules) doit être conditionnelle
-- Elle ne doit s'afficher QUE SI l'utilisateur a des véhicules
-- =====================================================

BEGIN;

-- Vérifier l'état actuel
SELECT '═══ ÉTAT ACTUEL TICPE_003 ═══' as titre;

SELECT 
    question_id,
    question_text,
    question_order,
    question_type,
    conditions,
    CASE 
        WHEN conditions IS NULL OR conditions = '{}'::jsonb 
        THEN '❌ Pas de condition (toujours affichée)'
        ELSE '✅ Conditionnelle'
    END as statut
FROM "QuestionnaireQuestion"
WHERE question_id = 'TICPE_003';

-- ============================================================================
-- CORRECTION: AJOUTER LA CONDITION
-- ============================================================================

-- TICPE_003 doit s'afficher SI TICPE_001 = "Oui"
UPDATE "QuestionnaireQuestion"
SET conditions = jsonb_build_object(
    'depends_on', (SELECT id::text FROM "QuestionnaireQuestion" WHERE question_id = 'TICPE_001'),
    'value', 'Oui',
    'operator', 'equals'
)
WHERE question_id = 'TICPE_003';

-- ============================================================================
-- VÉRIFICATION APRÈS CORRECTION
-- ============================================================================

SELECT '═══ TICPE_003 CORRIGÉE ═══' as titre;

SELECT 
    qq.question_id,
    qq.question_text,
    qq.question_order,
    qq.conditions,
    dep.question_id as depend_de,
    qq.conditions->>'value' as valeur_requise,
    CASE 
        WHEN qq.conditions IS NULL THEN '❌ Pas de condition'
        WHEN dep.id IS NULL THEN '❌ UUID invalide'
        WHEN dep.question_id = 'TICPE_001' 
         AND qq.conditions->>'value' = 'Oui'
        THEN '✅ Condition correcte (SI TICPE_001 = Oui)'
        ELSE '⚠️ Condition présente mais incorrecte'
    END as statut
FROM "QuestionnaireQuestion" qq
LEFT JOIN "QuestionnaireQuestion" dep ON dep.id::text = qq.conditions->>'depends_on'
WHERE qq.question_id = 'TICPE_003';

-- Vue d'ensemble des questions TICPE
SELECT '═══ VUE D''ENSEMBLE QUESTIONS TICPE ═══' as titre;

SELECT 
    qq.question_order as ordre,
    qq.question_id as code,
    LEFT(qq.question_text, 35) as question,
    dep.question_id as depend_de,
    qq.conditions->>'value' as valeur_requise,
    CASE 
        WHEN qq.conditions IS NULL OR qq.conditions = '{}'::jsonb 
        THEN '✅ Toujours visible'
        ELSE '🔀 SI ' || dep.question_id || ' = "' || (qq.conditions->>'value') || '"'
    END as condition
FROM "QuestionnaireQuestion" qq
LEFT JOIN "QuestionnaireQuestion" dep ON dep.id::text = qq.conditions->>'depends_on'
WHERE qq.question_id LIKE 'TICPE%'
ORDER BY qq.question_order;

COMMIT;

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================
/*
LOGIQUE TICPE CORRIGÉE:

1. TICPE_001 (ordre 6): "Possédez-vous des véhicules ?"
   → Toujours visible
   → Réponses: Oui / Non

2. TICPE_003 (ordre 7): "Quels types de véhicules ?"
   → ✅ MAINTENANT conditionnelle: SI TICPE_001 = "Oui"
   → Réponses: Choix multiple (Camions +7,5T, etc.)

3. TICPE_002 (ordre 9): "Litres de carburant mensuel ?"
   → Conditionnelle: SI TICPE_001 = "Oui"
   → Réponse: Nombre

FLUX UTILISATEUR:
- Si répond "Non" à TICPE_001 → Skip TICPE_003 ET TICPE_002
- Si répond "Oui" à TICPE_001 → Affiche TICPE_003 puis TICPE_002

COHÉRENCE:
✅ Les 3 questions TICPE sont maintenant alignées
*/

