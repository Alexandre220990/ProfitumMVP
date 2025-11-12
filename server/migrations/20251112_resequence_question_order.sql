-- ============================================================================
-- Re-sequence questionnaire question_order globally
-- ============================================================================
-- Objectif :
--   Assigner un ordre unique et croissant à toutes les questions
--   en s'appuyant sur l'ordre actuel (question_order) puis question_id.
--   Les conditions restent inchangées.
-- ============================================================================

BEGIN;

WITH resequenced AS (
  SELECT
    id,
    question_id,
    ROW_NUMBER() OVER (ORDER BY question_order ASC NULLS LAST, question_id ASC NULLS LAST) AS tentative_order
  FROM "QuestionnaireQuestion"
)
UPDATE "QuestionnaireQuestion" q
SET question_order = COALESCE(custom_orders.new_order, resequenced.tentative_order)
FROM resequenced
LEFT JOIN (
  VALUES
    ('GENERAL_001', 1),
    ('GENERAL_002', 2),
    ('GENERAL_003', 3),
    ('GENERAL_004', 4),
    ('FONCIER_001', 5),
    ('RECOUVR_001', 6),
    ('ENERGIE_ELEC_FACTURES', 7),
    ('ENERGIE_ELEC_MONTANT', 8),
    ('ENERGIE_GAZ_FACTURES', 9),
    ('ENERGIE_GAZ_MONTANT', 10),
    ('TICPE_001', 11),
    ('TICPE_003', 12),
    ('TICPE_002', 13),
    ('DFS_001', 14)
) AS custom_orders(question_id, new_order)
  ON custom_orders.question_id = resequenced.question_id
WHERE q.id = resequenced.id;

COMMIT;

-- ============================================================================
-- FIN
-- ============================================================================

