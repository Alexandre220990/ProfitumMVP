-- Migration pour créer la table access_logs
-- Cette table stocke tous les logs d'accès pour la conformité ISO 27001

CREATE TABLE IF NOT EXISTS access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id TEXT,
    user_type TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT false,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les requêtes de logs
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_type ON access_logs(user_type);
CREATE INDEX IF NOT EXISTS idx_access_logs_success ON access_logs(success);
CREATE INDEX IF NOT EXISTS idx_access_logs_resource ON access_logs(resource);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_access_logs_user_timestamp ON access_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_access_logs_type_timestamp ON access_logs(user_type, timestamp);

-- Politique RLS pour sécuriser les logs (seuls les admins peuvent voir les logs)
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'insertion des logs (système)
CREATE POLICY "Enable insert for system" ON access_logs
    FOR INSERT WITH CHECK (true);

-- Politique pour permettre la lecture des logs (admins seulement)
CREATE POLICY "Enable read for admins" ON access_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "Expert" 
            WHERE "Expert".auth_id = auth.uid() 
            AND "Expert".status = 'active'
            AND "Expert".role = 'admin'
        )
    );

-- Commentaire pour documenter la table
COMMENT ON TABLE access_logs IS 'Table de logs d''accès pour la conformité ISO 27001 - Stocke tous les accès aux ressources protégées';
COMMENT ON COLUMN access_logs.user_id IS 'ID de l''utilisateur (peut être null pour les accès anonymes)';
COMMENT ON COLUMN access_logs.user_type IS 'Type d''utilisateur: client, expert, admin, anonymous, public';
COMMENT ON COLUMN access_logs.action IS 'Action HTTP: GET, POST, PUT, DELETE, etc.';
COMMENT ON COLUMN access_logs.resource IS 'Ressource accédée (URL, endpoint)';
COMMENT ON COLUMN access_logs.success IS 'Indique si l''accès a réussi';
COMMENT ON COLUMN access_logs.error_message IS 'Message d''erreur en cas d''échec'; 