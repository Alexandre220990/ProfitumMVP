-- =====================================================
-- CORRECTION : Questions du Simulateur (SANS description)
-- =====================================================
-- Convertir les tranches en NOMBRE EXACT
-- =====================================================

BEGIN;

-- ========================================
-- 1️⃣ GENERAL_002 : CA Annuel
-- ========================================

UPDATE "QuestionnaireQuestion"
SET 
    question_type = 'nombre',
    question_text = 'Quel est votre chiffre d''affaires annuel (en €) ?',
    options = '{
        "min": 0,
        "max": 100000000,
        "unite": "€",
        "step": 1000
    }'::jsonb,
    placeholder = 'Ex: 250000'
WHERE question_id = 'GENERAL_002';

-- ========================================
-- 2️⃣ GENERAL_003 : Nombre d''Employés
-- ========================================

UPDATE "QuestionnaireQuestion"
SET 
    question_type = 'nombre',
    question_text = 'Combien d''employés compte votre entreprise ?',
    options = '{
        "min": 0,
        "max": 10000,
        "unite": "employés"
    }'::jsonb,
    placeholder = 'Ex: 25'
WHERE question_id = 'GENERAL_003';

-- ========================================
-- 3️⃣ GENERAL_006 : Contentieux (NOUVEAU)
-- ========================================

INSERT INTO "QuestionnaireQuestion" (
    question_id,
    question_text,
    question_type,
    question_order,
    section,
    options,
    placeholder,
    importance,
    produits_cibles
)
VALUES (
    'GENERAL_006',
    'Combien de contentieux (fiscaux ou URSSAF) avez-vous en cours ?',
    'nombre',
    6,
    'Général',
    '{
        "min": 0,
        "max": 100,
        "unite": "contentieux"
    }'::jsonb,
    'Ex: 0 si aucun',
    2,
    ARRAY['URSSAF', 'MSA']::text[]
)
ON CONFLICT (question_id) DO UPDATE
SET 
    question_type = EXCLUDED.question_type,
    question_text = EXCLUDED.question_text,
    options = EXCLUDED.options,
    placeholder = EXCLUDED.placeholder;

-- ========================================
-- 4️⃣ RECOUVR_001 : Impayés
-- ========================================

UPDATE "QuestionnaireQuestion"
SET 
    question_type = 'nombre',
    question_text = 'Quel est le montant total de vos impayés clients (en €) ?',
    options = '{
        "min": 0,
        "max": 10000000,
        "unite": "€",
        "step": 100
    }'::jsonb,
    placeholder = 'Ex: 0 si aucun impayé'
WHERE question_id = 'RECOUVR_001';

-- ========================================
-- VÉRIFICATION FINALE
-- ========================================

SELECT 
    question_order as "N°",
    question_id as "Code",
    question_text as "Question",
    question_type as "Type",
    options->'min' as "Min",
    options->'max' as "Max",
    options->'unite' as "Unité"
FROM "QuestionnaireQuestion"
WHERE question_id IN ('GENERAL_002', 'GENERAL_003', 'GENERAL_006', 'RECOUVR_001')
ORDER BY question_order;

COMMIT;

-- =====================================================
-- RÉSULTATS ATTENDUS :
-- =====================================================
-- GENERAL_002 : CA annuel (NOMBRE, 0-100M€)
-- GENERAL_003 : Nombre d'employés (NOMBRE, 0-10000)
-- GENERAL_006 : Contentieux (NOMBRE, 0-100) [NOUVEAU]
-- RECOUVR_001 : Impayés (NOMBRE, 0-10M€)
-- =====================================================

