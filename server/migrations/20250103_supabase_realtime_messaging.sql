-- Migration pour Supabase Realtime Messaging
-- Date: 2025-01-03
-- Description: Configuration des tables et politiques RLS pour la messagerie temps réel

-- ========================================
-- TABLE CONVERSATIONS OPTIMISÉE
-- ========================================

-- Supprimer l'ancienne table si elle existe
DROP TABLE IF EXISTS conversations CASCADE;

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('expert_client', 'admin_support', 'internal')),
    participant_ids UUID[] NOT NULL,
    title VARCHAR(200),
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLE MESSAGES OPTIMISÉE
-- ========================================

-- Supprimer l'ancienne table si elle existe
DROP TABLE IF EXISTS messages CASCADE;

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('client', 'expert', 'admin', 'system')),
    sender_name VARCHAR(100),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system', 'notification')),
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLE INDICATEURS DE FRAPPE
-- ========================================

CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'expert', 'admin')),
    is_typing BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- ========================================
-- INDEX POUR PERFORMANCE
-- ========================================

-- Index pour les conversations
CREATE INDEX idx_conversations_participant_ids ON conversations USING GIN (participant_ids);
CREATE INDEX idx_conversations_type ON conversations (type);
CREATE INDEX idx_conversations_last_message_at ON conversations (last_message_at DESC);
CREATE INDEX idx_conversations_status ON conversations (status);

-- Index pour les messages
CREATE INDEX idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX idx_messages_sender_id ON messages (sender_id);
CREATE INDEX idx_messages_created_at ON messages (created_at DESC);
CREATE INDEX idx_messages_is_read ON messages (is_read);

-- Index pour les indicateurs de frappe
CREATE INDEX idx_typing_indicators_conversation_id ON typing_indicators (conversation_id);
CREATE INDEX idx_typing_indicators_user_id ON typing_indicators (user_id);
CREATE INDEX idx_typing_indicators_is_typing ON typing_indicators (is_typing);

-- ========================================
-- POLITIQUES RLS (ROW LEVEL SECURITY)
-- ========================================

-- Activer RLS sur toutes les tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Politiques pour les conversations
CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING (
        auth.uid() = ANY(participant_ids)
    );

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (
        auth.uid() = ANY(participant_ids)
    );

CREATE POLICY "Users can update their conversations" ON conversations
    FOR UPDATE USING (
        auth.uid() = ANY(participant_ids)
    );

-- Politiques pour les messages
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE auth.uid() = ANY(participant_ids)
        )
    );

CREATE POLICY "Users can send messages to their conversations" ON messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE auth.uid() = ANY(participant_ids)
        ) AND sender_id = auth.uid()
    );

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (
        sender_id = auth.uid()
    );

-- Politiques pour les indicateurs de frappe
CREATE POLICY "Users can view typing indicators in their conversations" ON typing_indicators
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM conversations 
            WHERE auth.uid() = ANY(participant_ids)
        )
    );

CREATE POLICY "Users can manage their own typing indicators" ON typing_indicators
    FOR ALL USING (
        user_id = auth.uid()
    );

-- ========================================
-- FONCTIONS TRIGGER POUR MISE À JOUR AUTOMATIQUE
-- ========================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at 
    BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_typing_indicators_updated_at 
    BEFORE UPDATE ON typing_indicators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- FONCTION POUR METTRE À JOUR LAST_MESSAGE_AT
-- ========================================

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour last_message_at
CREATE TRIGGER update_conversation_last_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ========================================
-- FONCTION POUR NETTOYER LES INDICATEURS DE FRAPPE
-- ========================================

CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM typing_indicators 
    WHERE updated_at < NOW() - INTERVAL '5 minutes';
END;
$$ language 'plpgsql';

-- ========================================
-- CONFIGURATION SUPABASE REALTIME
-- ========================================

-- Activer les publications Realtime pour les tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;

-- ========================================
-- DONNÉES INITIALES
-- ========================================

-- Insérer une conversation admin par défaut (si nécessaire)
-- Cette conversation sera créée automatiquement par l'application

-- ========================================
-- COMMENTAIRES ET DOCUMENTATION
-- ========================================

COMMENT ON TABLE conversations IS 'Table des conversations avec support Supabase Realtime';
COMMENT ON TABLE messages IS 'Table des messages avec support temps réel';
COMMENT ON TABLE typing_indicators IS 'Table des indicateurs de frappe en temps réel';

COMMENT ON COLUMN conversations.participant_ids IS 'Array des IDs des participants à la conversation';
COMMENT ON COLUMN conversations.type IS 'Type de conversation: expert_client, admin_support, internal';
COMMENT ON COLUMN messages.sender_type IS 'Type de l''expéditeur: client, expert, admin, system';
COMMENT ON COLUMN messages.metadata IS 'Métadonnées JSON pour les fichiers et autres données';
COMMENT ON COLUMN typing_indicators.is_typing IS 'Indique si l''utilisateur est en train de taper';

-- ========================================
-- FIN DE LA MIGRATION
-- ========================================

-- Vérifier que tout est configuré correctement
SELECT 'Migration Supabase Realtime Messaging terminée avec succès' as status; 