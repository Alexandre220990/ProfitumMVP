-- Migration pour commenter les tables inutilisées
-- Ces tables sont marquées comme obsolètes mais conservées pour vérification

BEGIN;

-- Commenter les tables de vérification d'existence (seulement si elles existent)
DO $$
BEGIN
    -- Vérifier et commenter conversation_exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversation_exists' AND table_schema = 'public') THEN
        COMMENT ON TABLE "public"."conversation_exists" IS 'OBSOLÈTE - Table de vérification d''existence utilisée uniquement dans les migrations de déduplication. À supprimer après vérification.';
        RAISE NOTICE 'Table conversation_exists commentée';
    ELSE
        RAISE NOTICE 'Table conversation_exists n''existe pas';
    END IF;

    -- Vérifier et commenter message_files_exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'message_files_exists' AND table_schema = 'public') THEN
        COMMENT ON TABLE "public"."message_files_exists" IS 'OBSOLÈTE - Table de vérification d''existence non utilisée. À supprimer après vérification.';
        RAISE NOTICE 'Table message_files_exists commentée';
    ELSE
        RAISE NOTICE 'Table message_files_exists n''existe pas';
    END IF;

    -- Vérifier et commenter messages_exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages_exists' AND table_schema = 'public') THEN
        COMMENT ON TABLE "public"."messages_exists" IS 'OBSOLÈTE - Table de vérification d''existence utilisée uniquement dans les migrations de déduplication. À supprimer après vérification.';
        RAISE NOTICE 'Table messages_exists commentée';
    ELSE
        RAISE NOTICE 'Table messages_exists n''existe pas';
    END IF;

    -- Vérifier et commenter typing_indicators_exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'typing_indicators_exists' AND table_schema = 'public') THEN
        COMMENT ON TABLE "public"."typing_indicators_exists" IS 'OBSOLÈTE - Table de vérification d''existence non utilisée. À supprimer après vérification.';
        RAISE NOTICE 'Table typing_indicators_exists commentée';
    ELSE
        RAISE NOTICE 'Table typing_indicators_exists n''existe pas';
    END IF;

    -- Vérifier et commenter les tables TICPE vacantes
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'TICPEAdminMaturity' AND table_schema = 'public') THEN
        COMMENT ON TABLE "public"."TICPEAdminMaturity" IS 'OBSOLÈTE - Table TICPE non utilisée dans le code actuel. À supprimer après vérification.';
        RAISE NOTICE 'Table TICPEAdminMaturity commentée';
    ELSE
        RAISE NOTICE 'Table TICPEAdminMaturity n''existe pas';
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'TICPEAdvancedRules' AND table_schema = 'public') THEN
        COMMENT ON TABLE "public"."TICPEAdvancedRules" IS 'OBSOLÈTE - Table TICPE non utilisée dans le code actuel. À supprimer après vérification.';
        RAISE NOTICE 'Table TICPEAdvancedRules commentée';
    ELSE
        RAISE NOTICE 'Table TICPEAdvancedRules n''existe pas';
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'TICPEUsageScenarios' AND table_schema = 'public') THEN
        COMMENT ON TABLE "public"."TICPEUsageScenarios" IS 'OBSOLÈTE - Table TICPE non utilisée dans le code actuel. À supprimer après vérification.';
        RAISE NOTICE 'Table TICPEUsageScenarios commentée';
    ELSE
        RAISE NOTICE 'Table TICPEUsageScenarios n''existe pas';
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'TICPESimulationResults' AND table_schema = 'public') THEN
        COMMENT ON TABLE "public"."TICPESimulationResults" IS 'OBSOLÈTE - Table TICPE non utilisée dans le code actuel. À supprimer après vérification.';
        RAISE NOTICE 'Table TICPESimulationResults commentée';
    ELSE
        RAISE NOTICE 'Table TICPESimulationResults n''existe pas';
    END IF;

END $$;

COMMIT; 