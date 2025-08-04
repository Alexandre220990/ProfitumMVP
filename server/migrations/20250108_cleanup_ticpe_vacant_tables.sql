-- Migration pour nettoyer les tables TICPE vacantes
-- Ces tables ne sont pas utilisées dans le code actuel

BEGIN;

-- Suppression des tables TICPE vacantes
DROP TABLE IF EXISTS "public"."TICPEAdminMaturity";
DROP TABLE IF EXISTS "public"."TICPEAdvancedRules";
DROP TABLE IF EXISTS "public"."TICPEUsageScenarios";
DROP TABLE IF EXISTS "public"."TICPESimulationResults";

-- Suppression des index associés (si existants)
DROP INDEX IF EXISTS idx_ticpe_admin_maturity;
DROP INDEX IF EXISTS idx_ticpe_advanced_rules;
DROP INDEX IF EXISTS idx_ticpe_usage_scenarios;
DROP INDEX IF EXISTS idx_ticpe_simulation_results;

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
  'Suppression des tables TICPE vacantes',
  '{"tables": ["TICPEAdminMaturity", "TICPEAdvancedRules", "TICPEUsageScenarios", "TICPESimulationResults"]}'::jsonb,
  'system',
  'ticpe_vacant_tables_cleanup',
  true,
  NOW()
);

COMMIT; 