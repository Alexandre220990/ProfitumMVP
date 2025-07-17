-- =====================================================
-- CRÉATION DE LA TABLE QUESTIONNAIREQUESTION
-- Date: 2025-01-07
-- =====================================================

-- Table pour les questions du questionnaire
CREATE TABLE IF NOT EXISTS "public"."QuestionnaireQuestion" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "question_order" integer NOT NULL,
    "question_text" text NOT NULL,
    "question_type" text NOT NULL CHECK (question_type IN ('choix_unique', 'choix_multiple', 'nombre', 'texte', 'email', 'telephone')),
    "options" jsonb DEFAULT '{}'::jsonb,
    "validation_rules" jsonb DEFAULT '{}'::jsonb,
    "importance" integer DEFAULT 1 CHECK (importance >= 1 AND importance <= 5),
    "conditions" jsonb DEFAULT '{}'::jsonb,
    "produits_cibles" text[] DEFAULT '{}',
    "phase" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS "idx_questionnaire_question_order" ON "public"."QuestionnaireQuestion" ("question_order");
CREATE INDEX IF NOT EXISTS "idx_questionnaire_question_type" ON "public"."QuestionnaireQuestion" ("question_type");
CREATE INDEX IF NOT EXISTS "idx_questionnaire_question_phase" ON "public"."QuestionnaireQuestion" ("phase");

-- Contrainte d'unicité sur l'ordre des questions
ALTER TABLE "public"."QuestionnaireQuestion" 
ADD CONSTRAINT "unique_question_order" UNIQUE ("question_order");

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_questionnaire_question_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_questionnaire_question_updated_at
    BEFORE UPDATE ON "public"."QuestionnaireQuestion"
    FOR EACH ROW
    EXECUTE FUNCTION update_questionnaire_question_updated_at(); 