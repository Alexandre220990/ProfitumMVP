-- Migration pour créer la table admin_messages
-- Date: 2025-01-03
-- Description: Table pour stocker les messages directs entre utilisateurs et admin

CREATE TABLE IF NOT EXISTS admin_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    sender_id UUID NOT NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('client', 'expert', 'admin')),
    conversation_id VARCHAR(100) NOT NULL DEFAULT 'admin-support',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_admin_messages_conversation_id ON admin_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_sender_id ON admin_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_admin_messages_timestamp ON admin_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_admin_messages_is_read ON admin_messages(is_read);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_messages_updated_at 
    BEFORE UPDATE ON admin_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) pour sécuriser les données
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux admins de voir tous les messages
CREATE POLICY "Admins can view all admin messages" ON admin_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'type' = 'admin'
        )
    );

-- Politique pour permettre aux utilisateurs de voir leurs propres messages
CREATE POLICY "Users can view their own admin messages" ON admin_messages
    FOR SELECT USING (
        sender_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'type' = 'admin'
        )
    );

-- Politique pour permettre aux utilisateurs d'insérer leurs propres messages
CREATE POLICY "Users can insert their own admin messages" ON admin_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()
    );

-- Politique pour permettre aux admins de mettre à jour tous les messages
CREATE POLICY "Admins can update all admin messages" ON admin_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'type' = 'admin'
        )
    );

-- Commentaires sur la table
COMMENT ON TABLE admin_messages IS 'Table pour stocker les messages directs entre utilisateurs et admin';
COMMENT ON COLUMN admin_messages.id IS 'Identifiant unique du message';
COMMENT ON COLUMN admin_messages.content IS 'Contenu du message';
COMMENT ON COLUMN admin_messages.sender_id IS 'ID de l''expéditeur (client, expert ou admin)';
COMMENT ON COLUMN admin_messages.sender_type IS 'Type d''expéditeur (client, expert, admin)';
COMMENT ON COLUMN admin_messages.conversation_id IS 'ID de la conversation (par défaut admin-support)';
COMMENT ON COLUMN admin_messages.timestamp IS 'Horodatage du message';
COMMENT ON COLUMN admin_messages.is_read IS 'Indique si le message a été lu';
COMMENT ON COLUMN admin_messages.created_at IS 'Date de création du message';
COMMENT ON COLUMN admin_messages.updated_at IS 'Date de dernière modification du message'; 