-- =====================================================
-- AJOUT DE LA COLONNE SECTION À LA TABLE EXISTANTE
-- Date: 2025-01-07
-- =====================================================

-- 1. Ajouter la colonne section si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'QuestionnaireQuestion' 
        AND column_name = 'section'
    ) THEN
        ALTER TABLE "public"."QuestionnaireQuestion" 
        ADD COLUMN "section" text DEFAULT 'general';
    END IF;
END $$;

-- 2. Mettre à jour les questions existantes avec les bonnes sections
UPDATE "public"."QuestionnaireQuestion" 
SET section = 'presentation_generale'
WHERE question_id IN ('GENERAL_001', 'GENERAL_002', 'GENERAL_003', 'GENERAL_004', 'GENERAL_005', 'GENERAL_999');

UPDATE "public"."QuestionnaireQuestion" 
SET section = 'ticpe_specifique'
WHERE question_id LIKE 'TICPE_%';

-- 3. Créer l'index sur la colonne section si il n'existe pas
CREATE INDEX IF NOT EXISTS "idx_questionnaire_section" ON "public"."QuestionnaireQuestion" ("section");
CREATE INDEX IF NOT EXISTS "idx_questionnaire_section_phase" ON "public"."QuestionnaireQuestion" ("section", "phase");

-- 4. Vérifier la structure
SELECT 
    question_id,
    question_text,
    section,
    phase
FROM "public"."QuestionnaireQuestion"
ORDER BY question_order; 