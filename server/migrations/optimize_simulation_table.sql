-- Migration pour optimiser la table Simulation
-- Date: 2025-01-24

-- 1. Ajouter les colonnes manquantes pour une gestion complète
ALTER TABLE "Simulation" 
ADD COLUMN IF NOT EXISTS "type" TEXT DEFAULT 'chatbot',
ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'profitum',
ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}'::jsonb;

-- 2. Standardiser les noms de colonnes (optionnel - pour cohérence)
-- Renommer dateCreation en created_at si nécessaire
-- ALTER TABLE "Simulation" RENAME COLUMN "dateCreation" TO "created_at";

-- 3. Ajouter des contraintes pour la cohérence
ALTER TABLE "Simulation" 
ADD CONSTRAINT "simulation_statut_check" 
CHECK (statut IN ('en_cours', 'termine', 'abandonne', 'erreur'));

ALTER TABLE "Simulation" 
ADD CONSTRAINT "simulation_type_check" 
CHECK (type IN ('chatbot', 'manual', 'import', 'api'));

-- 4. Ajouter des index pour les performances
CREATE INDEX IF NOT EXISTS "idx_simulation_clientid" ON "Simulation" ("clientId");
CREATE INDEX IF NOT EXISTS "idx_simulation_statut" ON "Simulation" (statut);
CREATE INDEX IF NOT EXISTS "idx_simulation_type" ON "Simulation" (type);
CREATE INDEX IF NOT EXISTS "idx_simulation_created_at" ON "Simulation" (created_at);

-- 5. Ajouter des commentaires pour la documentation
COMMENT ON TABLE "Simulation" IS 'Table des simulations d''optimisation fiscale';
COMMENT ON COLUMN "Simulation"."type" IS 'Type de simulation: chatbot, manual, import, api';
COMMENT ON COLUMN "Simulation"."source" IS 'Source de la simulation: profitum, external, etc.';
COMMENT ON COLUMN "Simulation"."metadata" IS 'Métadonnées supplémentaires en JSON';
COMMENT ON COLUMN "Simulation"."Answers" IS 'Réponses collectées pendant la simulation';
COMMENT ON COLUMN "Simulation"."CheminParcouru" IS 'Chemin parcouru dans le processus de simulation'; 