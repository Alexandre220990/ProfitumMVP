-- Migration pour créer la table Notification (Système de notifications)
-- Date: 2025-01-03

-- Création de la table Notification
CREATE TABLE IF NOT EXISTS public.Notification (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'expert', 'admin')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('assignment', 'message', 'reminder', 'alert', 'promotion', 'system')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    action_data JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_dismissed BOOLEAN DEFAULT false,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notification_user_id ON public.Notification(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_user_type ON public.Notification(user_type);
CREATE INDEX IF NOT EXISTS idx_notification_type ON public.Notification(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_is_read ON public.Notification(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_priority ON public.Notification(priority);
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON public.Notification(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_expires_at ON public.Notification(expires_at);
CREATE INDEX IF NOT EXISTS idx_notification_is_dismissed ON public.Notification(is_dismissed);

-- Politique RLS
ALTER TABLE public.Notification ENABLE ROW LEVEL SECURITY;

-- Utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their own notifications" ON public.Notification
    FOR SELECT USING (user_id = auth.uid());

-- Utilisateurs peuvent gérer leurs propres notifications
CREATE POLICY "Users can manage their own notifications" ON public.Notification
    FOR ALL USING (user_id = auth.uid());

-- Admins peuvent voir toutes les notifications
CREATE POLICY "Admins can view all notifications" ON public.Notification
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public."Admin" 
            WHERE "Admin".email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_updated_at
    BEFORE UPDATE ON public.Notification
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();

-- Trigger pour marquer comme lue automatiquement
CREATE OR REPLACE FUNCTION mark_notification_as_read()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = true AND OLD.is_read = false THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mark_notification_as_read
    BEFORE UPDATE ON public.Notification
    FOR EACH ROW
    EXECUTE FUNCTION mark_notification_as_read();

-- Trigger pour marquer comme rejetée
CREATE OR REPLACE FUNCTION mark_notification_as_dismissed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_dismissed = true AND OLD.is_dismissed = false THEN
        NEW.dismissed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mark_notification_as_dismissed
    BEFORE UPDATE ON public.Notification
    FOR EACH ROW
    EXECUTE FUNCTION mark_notification_as_dismissed();

-- Fonction pour nettoyer les notifications expirées
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM public.Notification 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Commentaire sur la table
COMMENT ON TABLE public.Notification IS 'Système de notifications pour clients, experts et admins'; 