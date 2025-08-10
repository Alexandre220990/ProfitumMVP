-- Migration pour créer la table AdminNotification
-- Date: 2025-01-05
-- Description: Table pour stocker les notifications admin concernant la validation de documents

-- Créer la table AdminNotification
CREATE TABLE IF NOT EXISTS "AdminNotification" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected', 'archived')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    metadata JSONB DEFAULT '{}',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer un index sur le type et le statut pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_admin_notification_type_status ON "AdminNotification" (type, status);

-- Créer un index sur la date de création pour le tri
CREATE INDEX IF NOT EXISTS idx_admin_notification_created_at ON "AdminNotification" (created_at DESC);

-- Créer un index sur la priorité pour le tri
CREATE INDEX IF NOT EXISTS idx_admin_notification_priority ON "AdminNotification" (priority DESC);

-- Créer un index GIN sur les métadonnées JSONB pour les recherches
CREATE INDEX IF NOT EXISTS idx_admin_notification_metadata ON "AdminNotification" USING GIN (metadata);

-- Ajouter des commentaires pour la documentation
COMMENT ON TABLE "AdminNotification" IS 'Table pour stocker les notifications admin concernant la validation de documents clients';
COMMENT ON COLUMN "AdminNotification".type IS 'Type de notification (document_validation, etc.)';
COMMENT ON COLUMN "AdminNotification".title IS 'Titre de la notification';
COMMENT ON COLUMN "AdminNotification".message IS 'Message détaillé de la notification';
COMMENT ON COLUMN "AdminNotification".status IS 'Statut de la notification (pending, validated, rejected, archived)';
COMMENT ON COLUMN "AdminNotification".priority IS 'Priorité de la notification (low, medium, high, urgent)';
COMMENT ON COLUMN "AdminNotification".metadata IS 'Métadonnées JSON contenant les détails (client_id, documents, etc.)';
COMMENT ON COLUMN "AdminNotification".admin_notes IS 'Notes de l''administrateur lors de la validation/rejet';

-- Créer une fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_admin_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER trigger_update_admin_notification_updated_at
    BEFORE UPDATE ON "AdminNotification"
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_notification_updated_at();

-- Insérer des données de test (optionnel)
INSERT INTO "AdminNotification" (type, title, message, status, priority, metadata) VALUES
(
    'document_validation',
    'Validation d''éligibilité TICPE',
    'Le client Transport Express a soumis des documents pour validation de l''éligibilité TICPE',
    'pending',
    'high',
    '{
        "client_produit_id": "test-uuid-1",
        "client_id": "test-client-1",
        "client_name": "Transport Express",
        "client_email": "contact@transport-express.fr",
        "client_company": "Transport Express SARL",
        "product_type": "TICPE",
        "product_name": "Remboursement TICPE",
        "step": "eligibilite",
        "documents": [
            {"id": "doc-1", "type": "kbis", "filename": "kbis-transport-express.pdf"},
            {"id": "doc-2", "type": "immatriculation", "filename": "certificat-immatriculation.pdf"},
            {"id": "doc-3", "type": "facture_carburant", "filename": "facture-carburant-2024.pdf"}
        ],
        "submitted_at": "2025-01-05T10:00:00Z",
        "submitted_by": "test-user-1"
    }'::jsonb
);

-- Afficher un message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Table AdminNotification créée avec succès';
    RAISE NOTICE '📊 Index créés pour optimiser les performances';
    RAISE NOTICE '🔧 Trigger configuré pour updated_at automatique';
    RAISE NOTICE '📝 Données de test insérées';
END $$;
