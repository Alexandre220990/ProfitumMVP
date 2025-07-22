-- Migration pour ajouter la colonne sessionId à ClientProduitEligible
-- Date: 2025-01-27
-- Description: Ajout de la colonne sessionId pour gérer les sessions temporaires de simulation

-- Ajouter la colonne sessionId si elle n'existe pas déjà
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ClientProduitEligible' 
        AND column_name = 'sessionId'
    ) THEN
        ALTER TABLE "ClientProduitEligible" 
        ADD COLUMN "sessionId" uuid;
        
        -- Ajouter un index pour améliorer les performances
        CREATE INDEX IF NOT EXISTS "idx_clientproduit_session_id" 
        ON "ClientProduitEligible" ("sessionId");
        
        -- Ajouter une contrainte pour s'assurer qu'un ClientProduitEligible a soit un clientId soit un sessionId
        ALTER TABLE "ClientProduitEligible" 
        ADD CONSTRAINT "check_client_or_session" 
        CHECK (
            ("clientId" IS NOT NULL AND "sessionId" IS NULL) OR 
            ("clientId" IS NULL AND "sessionId" IS NOT NULL)
        );
        
        RAISE NOTICE 'Colonne sessionId ajoutée avec succès à ClientProduitEligible';
    ELSE
        RAISE NOTICE 'La colonne sessionId existe déjà dans ClientProduitEligible';
    END IF;
END $$;

-- Ajouter des commentaires pour documenter la nouvelle colonne
COMMENT ON COLUMN "ClientProduitEligible"."sessionId" IS 'ID de session temporaire pour les simulations non connectées';
COMMENT ON CONSTRAINT "check_client_or_session" ON "ClientProduitEligible" IS 'Contrainte pour s''assurer qu''un produit éligible est lié soit à un client soit à une session temporaire';

-- Créer une table pour stocker les sessions temporaires
CREATE TABLE IF NOT EXISTS "TemporarySimulationSession" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sessionId UUID UNIQUE NOT NULL,
    simulationData JSONB NOT NULL,
    expiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Index pour la table des sessions temporaires
CREATE INDEX IF NOT EXISTS "idx_temporary_session_session_id" 
ON "TemporarySimulationSession" (sessionId);

CREATE INDEX IF NOT EXISTS "idx_temporary_session_expires_at" 
ON "TemporarySimulationSession" (expiresAt);

-- Politique RLS pour les sessions temporaires
ALTER TABLE "TemporarySimulationSession" ENABLE ROW LEVEL SECURITY;

-- Fonction pour nettoyer automatiquement les sessions expirées
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    -- Supprimer les sessions expirées
    DELETE FROM "TemporarySimulationSession" 
    WHERE expiresAt < NOW();
    
    -- Supprimer les ClientProduitEligible orphelins (sessions expirées)
    DELETE FROM "ClientProduitEligible" 
    WHERE "sessionId" IS NOT NULL 
    AND "sessionId" NOT IN (
        SELECT sessionId FROM "TemporarySimulationSession"
    );
END;
$$ LANGUAGE plpgsql;

-- Créer un trigger pour nettoyer automatiquement les sessions expirées
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_sessions()
RETURNS trigger AS $$
BEGIN
    -- Nettoyer les sessions expirées toutes les heures
    IF (EXTRACT(EPOCH FROM (NOW() - (SELECT MAX(created_at) FROM "TemporarySimulationSession"))) > 3600) THEN
        PERFORM cleanup_expired_sessions();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS cleanup_expired_sessions_trigger ON "TemporarySimulationSession";
CREATE TRIGGER cleanup_expired_sessions_trigger
    AFTER INSERT ON "TemporarySimulationSession"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_cleanup_expired_sessions();

-- Commentaires pour la documentation
COMMENT ON TABLE "TemporarySimulationSession" IS 'Table des sessions temporaires pour les simulations non connectées';
COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Fonction pour nettoyer automatiquement les sessions expirées';
COMMENT ON FUNCTION trigger_cleanup_expired_sessions() IS 'Trigger pour nettoyer automatiquement les sessions expirées'; 