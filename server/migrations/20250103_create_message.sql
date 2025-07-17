-- Migration pour créer la table Message (Messagerie asynchrone)
-- Date: 2025-01-03

-- Création de la table Message
CREATE TABLE IF NOT EXISTS public.Message (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID REFERENCES public.ExpertAssignment(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('client', 'expert', 'admin')),
    sender_id UUID NOT NULL,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('client', 'expert', 'admin')),
    recipient_id UUID NOT NULL,
    subject VARCHAR(200),
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'notification', 'system')),
    attachments JSONB DEFAULT '[]'::jsonb,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    is_urgent BOOLEAN DEFAULT false,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'delivered', 'read', 'archived')),
    parent_message_id UUID REFERENCES public.Message(id) ON DELETE SET NULL,
    thread_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_message_assignment_id ON public.Message(assignment_id);
CREATE INDEX IF NOT EXISTS idx_message_sender_id ON public.Message(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_recipient_id ON public.Message(recipient_id);
CREATE INDEX IF NOT EXISTS idx_message_sender_type ON public.Message(sender_type);
CREATE INDEX IF NOT EXISTS idx_message_recipient_type ON public.Message(recipient_type);
CREATE INDEX IF NOT EXISTS idx_message_is_read ON public.Message(is_read);
CREATE INDEX IF NOT EXISTS idx_message_created_at ON public.Message(created_at);
CREATE INDEX IF NOT EXISTS idx_message_thread_id ON public.Message(thread_id);
CREATE INDEX IF NOT EXISTS idx_message_parent_message_id ON public.Message(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_message_status ON public.Message(status);
CREATE INDEX IF NOT EXISTS idx_message_priority ON public.Message(priority);

-- Politique RLS
ALTER TABLE public.Message ENABLE ROW LEVEL SECURITY;

-- Clients peuvent voir leurs messages
CREATE POLICY "Clients can view their messages" ON public.Message
    FOR SELECT USING (
        (sender_type = 'client' AND sender_id IN (
            SELECT id FROM public."Client" 
            WHERE auth_id = auth.uid()
        )) OR (recipient_type = 'client' AND recipient_id IN (
            SELECT id FROM public."Client" 
            WHERE auth_id = auth.uid()
        ))
    );

-- Experts peuvent voir leurs messages
CREATE POLICY "Experts can view their messages" ON public.Message
    FOR SELECT USING (
        (sender_type = 'expert' AND sender_id IN (
            SELECT id FROM public."Expert" 
            WHERE auth_id = auth.uid()
        )) OR (recipient_type = 'expert' AND recipient_id IN (
            SELECT id FROM public."Expert" 
            WHERE auth_id = auth.uid()
        ))
    );

-- Admins peuvent voir tous les messages
CREATE POLICY "Admins can view all messages" ON public.Message
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public."Admin" 
            WHERE "Admin".email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Gestion des messages (expéditeur et admins)
CREATE POLICY "Users can manage their messages" ON public.Message
    FOR ALL USING (
        (sender_type = 'client' AND sender_id IN (
            SELECT id FROM public."Client" 
            WHERE auth_id = auth.uid()
        )) OR (sender_type = 'expert' AND sender_id IN (
            SELECT id FROM public."Expert" 
            WHERE auth_id = auth.uid()
        )) OR EXISTS (
            SELECT 1 FROM public."Admin" 
            WHERE "Admin".email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_message_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_message_updated_at
    BEFORE UPDATE ON public.Message
    FOR EACH ROW
    EXECUTE FUNCTION update_message_updated_at();

-- Trigger pour générer thread_id automatiquement
CREATE OR REPLACE FUNCTION generate_message_thread_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.thread_id IS NULL THEN
        NEW.thread_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_message_thread_id
    BEFORE INSERT ON public.Message
    FOR EACH ROW
    EXECUTE FUNCTION generate_message_thread_id();

-- Commentaire sur la table
COMMENT ON TABLE public.Message IS 'Messages asynchrones entre clients, experts et admins'; 