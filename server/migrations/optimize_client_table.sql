-- Migration pour optimiser la table Client
-- Date: 2025-01-24

-- 1. Corriger les types de données
ALTER TABLE "Client" 
ALTER COLUMN "simulationId" TYPE BIGINT USING "simulationId"::bigint;

-- 2. Standardiser les valeurs par défaut
ALTER TABLE "Client" 
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- 3. Ajouter des contraintes de validation
ALTER TABLE "Client" 
ADD CONSTRAINT "client_email_check" 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE "Client" 
ADD CONSTRAINT "client_nombre_employes_check" 
CHECK (nombreEmployes >= 0);

ALTER TABLE "Client" 
ADD CONSTRAINT "client_revenu_annuel_check" 
CHECK (revenuAnnuel >= 0);

-- 4. Ajouter des index pour les performances
CREATE INDEX IF NOT EXISTS "idx_client_email" ON "Client" (email);
CREATE INDEX IF NOT EXISTS "idx_client_type" ON "Client" (type);
CREATE INDEX IF NOT EXISTS "idx_client_secteur" ON "Client" (secteurActivite);
CREATE INDEX IF NOT EXISTS "idx_client_created_at" ON "Client" (created_at);

-- 5. Ajouter des commentaires pour la documentation
COMMENT ON TABLE "Client" IS 'Table des clients de la plateforme Profitum';
COMMENT ON COLUMN "Client"."revenuAnnuel" IS 'Revenu annuel en euros';
COMMENT ON COLUMN "Client"."secteurActivite" IS 'Secteur d''activité de l''entreprise';
COMMENT ON COLUMN "Client"."nombreEmployes" IS 'Nombre d''employés de l''entreprise';
COMMENT ON COLUMN "Client"."ancienneteEntreprise" IS 'Ancienneté de l''entreprise en années'; 