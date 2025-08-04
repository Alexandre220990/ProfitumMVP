-- Migration pour nettoyer les tables de vérification d'existence
-- Ces tables ne sont utilisées que dans les migrations de déduplication

BEGIN;

-- Suppression des tables de vérification d'existence
DROP TABLE IF EXISTS "public"."conversation_exists";
DROP TABLE IF EXISTS "public"."message_files_exists";
DROP TABLE IF EXISTS "public"."messages_exists";
DROP TABLE IF EXISTS "public"."typing_indicators_exists";

-- Log de la migration
INSERT INTO "public"."audit_logs" (
  level,
  category,
  message,
  details,
  resource_type,
  resource_id,
  success,
  created_at
) VALUES (
  'INFO',
  'system',
  'Suppression des tables de vérification d''existence',
  '{"tables": ["conversation_exists", "message_files_exists", "messages_exists", "typing_indicators_exists"]}'::jsonb,
  'system',
  'verification_tables_cleanup',
  true,
  NOW()
);

COMMIT; 