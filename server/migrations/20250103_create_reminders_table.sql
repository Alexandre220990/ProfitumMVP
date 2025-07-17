-- Migration pour créer la table Reminder (Relances automatisées)
-- Date: 2025-01-03

-- Création de la table Reminder
CREATE TABLE IF NOT EXISTS "Reminder" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('dossier_incomplet', 'document_manquant', 'sla_expert', 'sla_client', 'paiement_en_retard', 'validation_requise')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged', 'resolved', 'cancelled')),
    
    -- Références aux entités
    client_id UUID REFERENCES "Client"(id) ON DELETE CASCADE,
    expert_id UUID REFERENCES "Expert"(id) ON DELETE CASCADE,
    client_produit_eligible_id UUID REFERENCES "ClientProduitEligible"(id) ON DELETE CASCADE,
    
    -- Contenu de la relance
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_required TEXT,
    action_url TEXT,
    
    -- Planification
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Configuration
    max_retries INTEGER DEFAULT 3,
    retry_interval_hours INTEGER DEFAULT 24,
    current_retry_count INTEGER DEFAULT 0,
    
    -- Métadonnées
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_reminder_type ON "Reminder"(type);
CREATE INDEX IF NOT EXISTS idx_reminder_status ON "Reminder"(status);
CREATE INDEX IF NOT EXISTS idx_reminder_priority ON "Reminder"(priority);
CREATE INDEX IF NOT EXISTS idx_reminder_scheduled_at ON "Reminder"(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reminder_client_id ON "Reminder"(client_id);
CREATE INDEX IF NOT EXISTS idx_reminder_expert_id ON "Reminder"(expert_id);
CREATE INDEX IF NOT EXISTS idx_reminder_pending_scheduled ON "Reminder"(status, scheduled_at) WHERE status = 'pending';

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_reminder_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reminder_updated_at
    BEFORE UPDATE ON "Reminder"
    FOR EACH ROW
    EXECUTE FUNCTION update_reminder_updated_at();

-- RLS (Row Level Security)
ALTER TABLE "Reminder" ENABLE ROW LEVEL SECURITY;

-- Politique pour les clients : voir leurs propres relances
CREATE POLICY "Clients can view their own reminders" ON "Reminder"
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM "Client" 
            WHERE auth_id = auth.uid()
        )
    );

-- Politique pour les experts : voir les relances qui les concernent
CREATE POLICY "Experts can view their own reminders" ON "Reminder"
    FOR SELECT USING (
        expert_id IN (
            SELECT id FROM "Expert" 
            WHERE auth_id = auth.uid()
        )
    );

-- Politique pour les admins : voir toutes les relances
CREATE POLICY "Admins can view all reminders" ON "Reminder"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Politique pour les clients : mettre à jour leurs propres relances
CREATE POLICY "Clients can update their own reminders" ON "Reminder"
    FOR UPDATE USING (
        client_id IN (
            SELECT id FROM "Client" 
            WHERE auth_id = auth.uid()
        )
    );

-- Politique pour les experts : mettre à jour les relances qui les concernent
CREATE POLICY "Experts can update their own reminders" ON "Reminder"
    FOR UPDATE USING (
        expert_id IN (
            SELECT id FROM "Expert" 
            WHERE auth_id = auth.uid()
        )
    );

-- Politique pour les admins : créer des relances
CREATE POLICY "Admins can create reminders" ON "Reminder"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Commentaires
COMMENT ON TABLE "Reminder" IS 'Table pour gérer les relances automatisées du workflow métier';
COMMENT ON COLUMN "Reminder".type IS 'Type de relance : dossier_incomplet, document_manquant, sla_expert, sla_client, paiement_en_retard, validation_requise';
COMMENT ON COLUMN "Reminder".priority IS 'Priorité de la relance : low, medium, high, critical';
COMMENT ON COLUMN "Reminder".status IS 'Statut de la relance : pending, sent, acknowledged, resolved, cancelled';
COMMENT ON COLUMN "Reminder".scheduled_at IS 'Date et heure planifiées pour l''envoi de la relance';
COMMENT ON COLUMN "Reminder".max_retries IS 'Nombre maximum de tentatives de relance';
COMMENT ON COLUMN "Reminder".retry_interval_hours IS 'Intervalle en heures entre les tentatives'; 