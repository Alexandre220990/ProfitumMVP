-- Migration pour corriger la structure de la table Notification
-- Date: 2025-01-03
-- Description: Correction de la structure de la table Notification pour correspondre au service client

-- 1. Vérifier si la table existe et la supprimer si nécessaire
DROP TABLE IF EXISTS public."Notification" CASCADE;
DROP TABLE IF EXISTS public.notification CASCADE;

-- 2. Créer la table Notification avec la structure correcte
CREATE TABLE IF NOT EXISTS public.Notification (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'expert', 'admin')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        -- Types génériques
        'assignment', 'message', 'reminder', 'alert', 'promotion', 'system',
        -- Types spécifiques pour les clients
        'document_uploaded', 'document_required', 'document_approved', 'document_rejected', 'document_expiring',
        -- Types spécifiques pour les dossiers
        'dossier_accepted', 'dossier_rejected', 'dossier_step_completed', 'dossier_audit_completed',
        -- Types spécifiques pour les messages
        'message_received', 'message_urgent', 'message_response',
        -- Types spécifiques pour les rappels
        'deadline_reminder', 'payment_reminder', 'validation_reminder'
    )),
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

-- 3. Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notification_user_id ON public.Notification(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_user_type ON public.Notification(user_type);
CREATE INDEX IF NOT EXISTS idx_notification_type ON public.Notification(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_is_read ON public.Notification(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_priority ON public.Notification(priority);
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON public.Notification(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_expires_at ON public.Notification(expires_at);
CREATE INDEX IF NOT EXISTS idx_notification_is_dismissed ON public.Notification(is_dismissed);

-- 4. Activer RLS
ALTER TABLE public.Notification ENABLE ROW LEVEL SECURITY;

-- 5. Créer les politiques RLS
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

-- 6. Créer les triggers
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

-- 7. Créer une fonction pour définir automatiquement l'expiration selon le type
CREATE OR REPLACE FUNCTION set_notification_expiration()
RETURNS TRIGGER AS $$
BEGIN
    -- Définir l'expiration selon le type de notification
    CASE NEW.notification_type
        -- Messages de rappel : 7 jours
        WHEN 'reminder' THEN
            NEW.expires_at = NOW() + INTERVAL '7 days';
        WHEN 'deadline_reminder' THEN
            NEW.expires_at = NOW() + INTERVAL '7 days';
        WHEN 'payment_reminder' THEN
            NEW.expires_at = NOW() + INTERVAL '7 days';
        WHEN 'validation_reminder' THEN
            NEW.expires_at = NOW() + INTERVAL '7 days';
        
        -- Notifications système : 30 jours
        WHEN 'system' THEN
            NEW.expires_at = NOW() + INTERVAL '30 days';
        WHEN 'promotion' THEN
            NEW.expires_at = NOW() + INTERVAL '30 days';
        
        -- Notifications critiques : pas d'expiration
        WHEN 'alert' THEN
            NEW.expires_at = NULL;
        WHEN 'dossier_rejected' THEN
            NEW.expires_at = NULL;
        WHEN 'message_urgent' THEN
            NEW.expires_at = NULL;
        
        -- Autres notifications : 14 jours par défaut
        ELSE
            NEW.expires_at = NOW() + INTERVAL '14 days';
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_notification_expiration
    BEFORE INSERT ON public.Notification
    FOR EACH ROW
    EXECUTE FUNCTION set_notification_expiration();

-- 8. Créer une fonction pour nettoyer les notifications expirées
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM public.Notification 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 9. Commentaires
COMMENT ON TABLE public.Notification IS 'Système de notifications pour clients, experts et admins avec types spécifiques et expiration automatique';
COMMENT ON COLUMN public.Notification.user_id IS 'ID de l\'utilisateur destinataire (référence auth.users)';
COMMENT ON COLUMN public.Notification.user_type IS 'Type d\'utilisateur (client, expert, admin)';
COMMENT ON COLUMN public.Notification.notification_type IS 'Type de notification avec cas d\'usage spécifiques';
COMMENT ON COLUMN public.Notification.action_data IS 'Données d\'action en JSON pour les redirections'; 