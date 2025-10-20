-- =====================================================
-- CORRECTION QUESTIONS SIMULATEUR V2
-- =====================================================

-- 1. SUPPRIMER la question TVA (produit retiré)
DELETE FROM "QuestionnaireQuestion"
WHERE question_id = 'TVA_001';

-- 2. AJOUTER les question_id manquants qui restent
-- (TVA_001 est déjà supprimé ci-dessus)

-- 3. CORRIGER les produits_cibles incohérents (type text[], pas jsonb)
UPDATE "QuestionnaireQuestion"
SET produits_cibles = ARRAY['ENERGIE', 'CEE']
WHERE id = '3156f7a4-57d5-4a17-8adf-d07e72c452ee'; -- Factures énergie

-- Corriger aussi les autres incohérences
UPDATE "QuestionnaireQuestion"
SET produits_cibles = ARRAY['TICPE']
WHERE id = '685ebbcf-40c4-4880-895e-0f1db722a101'; -- Types véhicules (enlever "Chronotachygraphes digitaux")

-- 4. VÉRIFIER qu'il n'y a plus de question_id NULL
SELECT 
    id,
    question_id,
    question_text
FROM "QuestionnaireQuestion"
WHERE question_id IS NULL;

-- 5. VÉRIFICATION FINALE - Liste complète
SELECT 
    question_order,
    question_id,
    question_text,
    question_type,
    produits_cibles
FROM "QuestionnaireQuestion"
ORDER BY question_order;

-- 6. Compter les questions par produit
SELECT 
    unnest(produits_cibles) as produit,
    COUNT(*) as nb_questions
FROM "QuestionnaireQuestion"
GROUP BY produit
ORDER BY nb_questions DESC;

