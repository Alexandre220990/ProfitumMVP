-- Migration pour créer la table ExpertNotifications
-- Date: 2025-01-03
-- Description: Table pour gérer les notifications des experts

-- Créer la table ExpertNotifications
CREATE TABLE IF NOT EXISTS "ExpertNotifications" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expert_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('preselection', 'message', 'assignment', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_expert_notifications_expert_id 
ON "ExpertNotifications" (expert_id);

CREATE INDEX IF NOT EXISTS idx_expert_notifications_type 
ON "ExpertNotifications" (type);

CREATE INDEX IF NOT EXISTS idx_expert_notifications_read 
ON "ExpertNotifications" (read);

CREATE INDEX IF NOT EXISTS idx_expert_notifications_created_at 
ON "ExpertNotifications" (created_at);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_expert_notifications_expert_read 
ON "ExpertNotifications" (expert_id, read);

-- Activer RLS
ALTER TABLE "ExpertNotifications" ENABLE ROW LEVEL SECURITY;

-- Politique RLS : les experts ne peuvent voir que leurs propres notifications
CREATE POLICY "Experts can view own notifications" ON "ExpertNotifications"
    FOR SELECT USING (expert_id = auth.uid());

-- Politique RLS : les experts peuvent modifier leurs propres notifications
CREATE POLICY "Experts can update own notifications" ON "ExpertNotifications"
    FOR UPDATE USING (expert_id = auth.uid());

-- Politique RLS : les experts peuvent supprimer leurs propres notifications
CREATE POLICY "Experts can delete own notifications" ON "ExpertNotifications"
    FOR DELETE USING (expert_id = auth.uid());

-- Politique RLS : les experts peuvent créer leurs propres notifications
CREATE POLICY "Experts can insert own notifications" ON "ExpertNotifications"
    FOR INSERT WITH CHECK (expert_id = auth.uid());

-- Commentaires
COMMENT ON TABLE "ExpertNotifications" IS 'Table des notifications pour les experts';
COMMENT ON COLUMN "ExpertNotifications".expert_id IS 'ID de l\'expert destinataire';
COMMENT ON COLUMN "ExpertNotifications".type IS 'Type de notification (preselection, message, assignment, system)';
COMMENT ON COLUMN "ExpertNotifications".title IS 'Titre de la notification';
COMMENT ON COLUMN "ExpertNotifications".message IS 'Message de la notification';
COMMENT ON COLUMN "ExpertNotifications".data IS 'Données supplémentaires en JSON';
COMMENT ON COLUMN "ExpertNotifications".read IS 'Indique si la notification a été lue';
COMMENT ON COLUMN "ExpertNotifications".read_at IS 'Date de lecture de la notification'; 