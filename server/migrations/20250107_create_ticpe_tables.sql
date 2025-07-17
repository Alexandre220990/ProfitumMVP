-- =====================================================
-- CRÉATION DES TABLES TICPE OPTIMISÉES
-- Date: 2025-01-07
-- Basé sur les données réelles de récupération TICPE
-- =====================================================

-- Table des secteurs d'activité TICPE avec performance
CREATE TABLE IF NOT EXISTS "public"."TICPESectors" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "sector_name" text NOT NULL UNIQUE,
    "sector_code" text NOT NULL UNIQUE,
    "eligibility_clarity" integer NOT NULL CHECK (eligibility_clarity >= 1 AND eligibility_clarity <= 5),
    "documentation_quality" integer NOT NULL CHECK (documentation_quality >= 1 AND documentation_quality <= 5),
    "recovery_rate" integer NOT NULL CHECK (recovery_rate >= 1 AND recovery_rate <= 5),
    "performance_score" integer NOT NULL CHECK (performance_score >= 1 AND performance_score <= 5),
    "description" text,
    "advantages" text[],
    "challenges" text[],
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Table des types de carburant et leurs taux
CREATE TABLE IF NOT EXISTS "public"."TICPERates" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "fuel_type" text NOT NULL UNIQUE,
    "fuel_code" text NOT NULL UNIQUE,
    "rate_2024" numeric(5,3) NOT NULL,
    "rate_2023" numeric(5,3),
    "rate_2022" numeric(5,3),
    "unit" text DEFAULT '€/L',
    "description" text,
    "eligibility_conditions" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Table des types de véhicules avec coefficients
CREATE TABLE IF NOT EXISTS "public"."TICPEVehicleTypes" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "vehicle_type" text NOT NULL UNIQUE,
    "vehicle_code" text NOT NULL UNIQUE,
    "weight_min" numeric(5,1),
    "weight_max" numeric(5,1),
    "eligibility_coefficient" numeric(3,2) NOT NULL CHECK (eligibility_coefficient >= 0 AND eligibility_coefficient <= 1),
    "description" text,
    "usage_conditions" text,
    "documentation_requirements" text[],
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Table des scénarios d'usage professionnel
CREATE TABLE IF NOT EXISTS "public"."TICPEUsageScenarios" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "scenario_name" text NOT NULL UNIQUE,
    "professional_percentage_min" integer NOT NULL CHECK (professional_percentage_min >= 0 AND professional_percentage_min <= 100),
    "professional_percentage_max" integer NOT NULL CHECK (professional_percentage_max >= 0 AND professional_percentage_max <= 100),
    "coefficient" numeric(3,2) NOT NULL CHECK (coefficient >= 0 AND coefficient <= 1),
    "description" text,
    "conditions" text[],
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Table des benchmarks par taille d'entreprise
CREATE TABLE IF NOT EXISTS "public"."TICPEBenchmarks" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "sector_id" uuid REFERENCES "public"."TICPESectors"(id),
    "vehicle_count_min" integer NOT NULL,
    "vehicle_count_max" integer NOT NULL,
    "fuel_type" text NOT NULL,
    "average_recovery" numeric(10,2) NOT NULL,
    "min_recovery" numeric(10,2),
    "max_recovery" numeric(10,2),
    "description" text,
    "sample_size" integer,
    "confidence_level" numeric(3,2),
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Table des règles de calcul TICPE avancées
CREATE TABLE IF NOT EXISTS "public"."TICPEAdvancedRules" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "rule_name" text NOT NULL UNIQUE,
    "rule_type" text NOT NULL CHECK (rule_type IN ('eligibility', 'calculation', 'bonus', 'penalty')),
    "conditions" jsonb NOT NULL,
    "calculation_formula" text NOT NULL,
    "weight" integer NOT NULL DEFAULT 1,
    "description" text,
    "examples" text[],
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Table des indicateurs de maturité administrative
CREATE TABLE IF NOT EXISTS "public"."TICPEAdminMaturity" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "indicator_name" text NOT NULL UNIQUE,
    "question_text" text NOT NULL,
    "max_points" integer NOT NULL DEFAULT 20,
    "scoring_rules" jsonb NOT NULL,
    "category" text NOT NULL CHECK (category IN ('documentation', 'process', 'technology', 'compliance')),
    "description" text,
    "best_practices" text[],
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Table des résultats de simulation TICPE détaillés
CREATE TABLE IF NOT EXISTS "public"."TICPESimulationResults" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "simulation_id" integer REFERENCES "public"."Simulation"(id),
    "sector_id" uuid REFERENCES "public"."TICPESectors"(id),
    "fuel_type" text NOT NULL,
    "vehicle_count" integer NOT NULL,
    "total_consumption" numeric(10,2),
    "professional_percentage" numeric(5,2),
    "base_amount" numeric(10,2),
    "vehicle_coefficient" numeric(3,2),
    "usage_coefficient" numeric(3,2),
    "final_amount" numeric(10,2),
    "confidence_score" integer CHECK (confidence_score >= 0 AND confidence_score <= 100),
    "maturity_score" integer CHECK (maturity_score >= 0 AND maturity_score <= 100),
    "benchmark_comparison" jsonb,
    "recommendations" text[],
    "risk_factors" text[],
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_ticpe_sectors_performance ON "public"."TICPESectors"(performance_score DESC);
CREATE INDEX IF NOT EXISTS idx_ticpe_rates_fuel_type ON "public"."TICPERates"(fuel_type);
CREATE INDEX IF NOT EXISTS idx_ticpe_vehicle_types_coefficient ON "public"."TICPEVehicleTypes"(eligibility_coefficient DESC);
CREATE INDEX IF NOT EXISTS idx_ticpe_benchmarks_sector ON "public"."TICPEBenchmarks"(sector_id);
CREATE INDEX IF NOT EXISTS idx_ticpe_simulation_results_simulation ON "public"."TICPESimulationResults"(simulation_id);

-- Contraintes de validation
ALTER TABLE "public"."TICPEBenchmarks" 
ADD CONSTRAINT check_vehicle_count_range 
CHECK (vehicle_count_min <= vehicle_count_max);

ALTER TABLE "public"."TICPEUsageScenarios" 
ADD CONSTRAINT check_percentage_range 
CHECK (professional_percentage_min <= professional_percentage_max);

-- Commentaires pour la documentation
COMMENT ON TABLE "public"."TICPESectors" IS 'Secteurs d''activité avec leurs performances de récupération TICPE';
COMMENT ON TABLE "public"."TICPERates" IS 'Taux de remboursement TICPE par type de carburant';
COMMENT ON TABLE "public"."TICPEVehicleTypes" IS 'Types de véhicules avec coefficients d''éligibilité';
COMMENT ON TABLE "public"."TICPEUsageScenarios" IS 'Scénarios d''usage professionnel avec coefficients';
COMMENT ON TABLE "public"."TICPEBenchmarks" IS 'Benchmarks de récupération par taille d''entreprise';
COMMENT ON TABLE "public"."TICPEAdvancedRules" IS 'Règles de calcul avancées pour le simulateur';
COMMENT ON TABLE "public"."TICPEAdminMaturity" IS 'Indicateurs de maturité administrative';
COMMENT ON TABLE "public"."TICPESimulationResults" IS 'Résultats détaillés des simulations TICPE'; 