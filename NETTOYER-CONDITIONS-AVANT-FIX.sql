-- =====================================================
-- NETTOYER LES CONDITIONS INCORRECTES AVANT DE REFAIRE
-- =====================================================
-- Ce script supprime les conditions qui ont le mauvais format
-- pour permettre au script FIX-SIMULATEUR-COMPLET.sql de fonctionner

BEGIN;

-- Supprimer toutes les conditions des questions 9-12
UPDATE "QuestionnaireQuestion"
SET conditions = NULL
WHERE question_id IN ('TICPE_002', 'DFS_001', 'FONCIER_001', 'ENERGIE_001');

-- Vérification
SELECT 
    question_id,
    question_text,
    question_order,
    CASE 
        WHEN conditions IS NULL THEN '✅ Nettoyé (NULL)'
        ELSE '⚠️ Toujours présent: ' || conditions::text
    END as statut
FROM "QuestionnaireQuestion"
WHERE question_id IN ('TICPE_002', 'DFS_001', 'FONCIER_001', 'ENERGIE_001')
ORDER BY question_order;

COMMIT;

-- =====================================================
-- MAINTENANT VOUS POUVEZ EXÉCUTER: FIX-SIMULATEUR-COMPLET.sql
-- =====================================================

