-- =====================================================
-- CORRECTION QUESTIONS SIMULATEUR
-- =====================================================

-- 1. SUPPRIMER les questions R&D obsolètes
DELETE FROM "QuestionnaireQuestion"
WHERE question_id IN ('CIR_001', 'CIR_002');

-- 2. AJOUTER les question_id manquants
UPDATE "QuestionnaireQuestion"
SET question_id = 'TICPE_002'
WHERE id = '154103bd-62dc-485a-a4a6-6e0a8d457a9e'; -- Consommation carburant

UPDATE "QuestionnaireQuestion"
SET question_id = 'DFS_001'
WHERE id = 'a65a9d33-0b7c-4acb-938a-de410a6587da'; -- Nombre chauffeurs

UPDATE "QuestionnaireQuestion"
SET question_id = 'FONCIER_001'
WHERE id = 'b61e0e88-b405-4066-9422-94de061970bd'; -- Taxe foncière

UPDATE "QuestionnaireQuestion"
SET question_id = 'ENERGIE_001'
WHERE id = '3156f7a4-57d5-4a17-8adf-d07e72c452ee'; -- Factures énergie

UPDATE "QuestionnaireQuestion"
SET question_id = 'TVA_001'
WHERE id = 'd3207985-8d20-414c-a52d-7d2c9ff03212'; -- Exports internationaux

-- 3. CORRIGER les produits_cibles incohérents
UPDATE "QuestionnaireQuestion"
SET produits_cibles = '["ENERGIE","CEE"]'::jsonb
WHERE id = '3156f7a4-57d5-4a17-8adf-d07e72c452ee';

-- 4. RÉORGANISER les question_order après suppression
UPDATE "QuestionnaireQuestion" SET question_order = 9 WHERE id = '154103bd-62dc-485a-a4a6-6e0a8d457a9e'; -- TICPE_002
UPDATE "QuestionnaireQuestion" SET question_order = 10 WHERE id = 'a65a9d33-0b7c-4acb-938a-de410a6587da'; -- DFS_001
UPDATE "QuestionnaireQuestion" SET question_order = 11 WHERE id = 'b61e0e88-b405-4066-9422-94de061970bd'; -- FONCIER_001
UPDATE "QuestionnaireQuestion" SET question_order = 12 WHERE id = '3156f7a4-57d5-4a17-8adf-d07e72c452ee'; -- ENERGIE_001
UPDATE "QuestionnaireQuestion" SET question_order = 13 WHERE id = 'd3207985-8d20-414c-a52d-7d2c9ff03212'; -- TVA_001

-- 5. VÉRIFICATION FINALE
SELECT 
    question_order,
    question_id,
    question_text,
    produits_cibles
FROM "QuestionnaireQuestion"
ORDER BY question_order;

