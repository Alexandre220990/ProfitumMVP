-- Migration pour le système de messagerie unifié
-- Date: 2025-01-03
-- Description: Système complet avec support fichiers et conversations avancées

-- ========================================
-- TABLE CONVERSATIONS UNIFIÉE
-- ========================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('expert_client', 'admin_support', 'internal')),
    assignment_id UUID REFERENCES expertassignment(id) ON DELETE SET NULL,
    participant_ids UUID[] NOT NULL,
    title VARCHAR(200),
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLE MESSAGES UNIFIÉE
-- ========================================

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('client', 'expert', 'admin')),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system', 'notification', 'typing')),
    attachments JSONB DEFAULT '[]'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    is_urgent BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLE FICHIERS
-- ========================================

CREATE TABLE IF NOT EXISTS message_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- TABLE NOTIFICATIONS
-- ========================================

CREATE TABLE IF NOT EXISTS message_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('new_message', 'file_uploaded', 'message_read', 'mention')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEX OPTIMISÉS
-- ========================================

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations USING GIN(participant_ids);
CREATE INDEX IF NOT EXISTS idx_conversations_assignment ON conversations(assignment_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);

-- Fichiers
CREATE INDEX IF NOT EXISTS idx_message_files_message ON message_files(message_id);
CREATE INDEX IF NOT EXISTS idx_message_files_type ON message_files(mime_type);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON message_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_conversation ON message_notifications(conversation_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON message_notifications(is_read);

-- ========================================
-- TRIGGERS ET FONCTIONS
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

-- Fonction pour mettre à jour last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET last_message_at = NEW.created_at 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_last_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ========================================
-- RLS (ROW LEVEL SECURITY)
-- ========================================

-- Activer RLS sur toutes les tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_notifications ENABLE ROW LEVEL SECURITY;

-- Politiques pour conversations
CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING (
        auth.uid() = ANY(participant_ids) OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'type' = 'admin'
        )
    );

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (
        auth.uid() = ANY(participant_ids)
    );

-- Politiques pour messages
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND auth.uid() = ANY(conversations.participant_ids)
        ) OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'type' = 'admin'
        )
    );

CREATE POLICY "Users can send messages in their conversations" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND auth.uid() = ANY(conversations.participant_ids)
        )
    );

-- Politiques pour fichiers
CREATE POLICY "Users can view files in their conversations" ON message_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages 
            JOIN conversations ON conversations.id = messages.conversation_id
            WHERE messages.id = message_files.message_id 
            AND auth.uid() = ANY(conversations.participant_ids)
        )
    );

-- Politiques pour notifications
CREATE POLICY "Users can view their notifications" ON message_notifications
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- ========================================
-- FONCTIONS UTILITAIRES
-- ========================================

-- Fonction pour créer une conversation admin
CREATE OR REPLACE FUNCTION create_admin_conversation(user_id UUID, user_type VARCHAR(20))
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
BEGIN
    INSERT INTO conversations (type, participant_ids, title, description)
    VALUES (
        'admin_support',
        ARRAY[user_id, '00000000-0000-0000-0000-000000000000'], -- admin_id placeholder
        'Support Administratif',
        'Conversation de support avec l''équipe administrative'
    )
    RETURNING id INTO conversation_id;
    
    -- Insérer le message de bienvenue
    INSERT INTO messages (conversation_id, sender_id, sender_type, content, message_type)
    VALUES (
        conversation_id,
        '00000000-0000-0000-0000-000000000000', -- admin_id placeholder
        'admin',
        CASE 
            WHEN user_type = 'client' THEN 'Bonjour ! Je suis votre assistant administratif. Je suis là pour vous aider avec toute question concernant la plateforme, nos experts, nos produits ou tout autre sujet. N''hésitez pas à me contacter à tout moment !'
            WHEN user_type = 'expert' THEN 'Bonjour ! Je suis votre assistant administratif. Je suis là pour vous aider avec toute question concernant la plateforme, vos missions, la facturation ou tout autre sujet. N''hésitez pas à me contacter à tout moment !'
            ELSE 'Bonjour ! Je suis votre assistant administratif. Comment puis-je vous aider ?'
        END,
        'text'
    );
    
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- COMMENTAIRES
-- ========================================

COMMENT ON TABLE conversations IS 'Conversations unifiées pour tous les types de messagerie';
COMMENT ON TABLE messages IS 'Messages dans les conversations';
COMMENT ON TABLE message_files IS 'Fichiers attachés aux messages';
COMMENT ON TABLE message_notifications IS 'Notifications de messagerie';

COMMENT ON COLUMN conversations.type IS 'Type de conversation: expert_client, admin_support, internal';
COMMENT ON COLUMN conversations.participant_ids IS 'Array des IDs des participants';
COMMENT ON COLUMN messages.message_type IS 'Type de message: text, file, system, notification, typing';
COMMENT ON COLUMN messages.attachments IS 'JSON array des métadonnées des fichiers';
COMMENT ON COLUMN message_files.file_path IS 'Chemin vers le fichier dans le stockage'; 