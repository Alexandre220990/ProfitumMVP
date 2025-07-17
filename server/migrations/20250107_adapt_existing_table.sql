-- =====================================================
-- ADAPTATION DE LA TABLE EXISTANTE
-- Date: 2025-01-07
-- =====================================================

-- 1. Ajouter les colonnes manquantes
DO $$ 
BEGIN
    -- Ajouter question_id si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'QuestionnaireQuestion' 
        AND column_name = 'question_id'
    ) THEN
        ALTER TABLE "public"."QuestionnaireQuestion" 
        ADD COLUMN "question_id" text;
    END IF;

    -- Ajouter section si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'QuestionnaireQuestion' 
        AND column_name = 'section'
    ) THEN
        ALTER TABLE "public"."QuestionnaireQuestion" 
        ADD COLUMN "section" text DEFAULT 'general';
    END IF;

    -- Ajouter validation_rules si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'QuestionnaireQuestion' 
        AND column_name = 'validation_rules'
    ) THEN
        ALTER TABLE "public"."QuestionnaireQuestion" 
        ADD COLUMN "validation_rules" jsonb DEFAULT '{}'::jsonb;
    END IF;

    -- Ajouter importance si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'QuestionnaireQuestion' 
        AND column_name = 'importance'
    ) THEN
        ALTER TABLE "public"."QuestionnaireQuestion" 
        ADD COLUMN "importance" integer DEFAULT 1;
    END IF;

    -- Ajouter conditions si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'QuestionnaireQuestion' 
        AND column_name = 'conditions'
    ) THEN
        ALTER TABLE "public"."QuestionnaireQuestion" 
        ADD COLUMN "conditions" jsonb DEFAULT '{}'::jsonb;
    END IF;

    -- Ajouter produits_cibles si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'QuestionnaireQuestion' 
        AND column_name = 'produits_cibles'
    ) THEN
        ALTER TABLE "public"."QuestionnaireQuestion" 
        ADD COLUMN "produits_cibles" text[] DEFAULT '{}';
    END IF;

    -- Ajouter phase si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'QuestionnaireQuestion' 
        AND column_name = 'phase'
    ) THEN
        ALTER TABLE "public"."QuestionnaireQuestion" 
        ADD COLUMN "phase" integer DEFAULT 1;
    END IF;
END $$;

-- 2. Créer les index manquants
CREATE INDEX IF NOT EXISTS "idx_questionnaire_question_order" ON "public"."QuestionnaireQuestion" ("question_order");
CREATE INDEX IF NOT EXISTS "idx_questionnaire_question_type" ON "public"."QuestionnaireQuestion" ("question_type");
CREATE INDEX IF NOT EXISTS "idx_questionnaire_question_phase" ON "public"."QuestionnaireQuestion" ("phase");
CREATE INDEX IF NOT EXISTS "idx_questionnaire_section" ON "public"."QuestionnaireQuestion" ("section");
CREATE INDEX IF NOT EXISTS "idx_questionnaire_section_phase" ON "public"."QuestionnaireQuestion" ("section", "phase");
CREATE INDEX IF NOT EXISTS "idx_questionnaire_produits_cibles" ON "public"."QuestionnaireQuestion" USING GIN ("produits_cibles");

-- 3. Vérifier la nouvelle structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'QuestionnaireQuestion'
ORDER BY ordinal_position; 