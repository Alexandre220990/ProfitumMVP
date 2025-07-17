-- Migration pour mettre à jour les types de notifications avec les cas d'usage spécifiques
-- Date: 2025-01-05

-- Mettre à jour les types de notifications pour inclure les cas d'usage spécifiques
ALTER TABLE public.Notification 
DROP CONSTRAINT IF EXISTS notification_type_check;

ALTER TABLE public.Notification 
ADD CONSTRAINT notification_type_check 
CHECK (notification_type IN (
    -- Types génériques existants
    'assignment', 'message', 'reminder', 'alert', 'promotion', 'system',
    
    -- Types spécifiques pour les clients
    'document_uploaded',           -- Nouveau document reçu de l'expert
    'document_required',           -- Document à envoyer pour finaliser le dossier
    'document_approved',           -- Document approuvé par l'expert
    'document_rejected',           -- Document rejeté par l'expert
    'document_expiring',           -- Document expirant bientôt
    
    -- Types spécifiques pour les dossiers
    'dossier_accepted',            -- Dossier accepté/validé par l'expert
    'dossier_rejected',            -- Dossier refusé → redirection marketplace
    'dossier_step_completed',      -- Nouvelle étape du dossier à compléter
    'dossier_audit_completed',     -- Audit terminé avec rapport disponible
    
    -- Types spécifiques pour les messages
    'message_received',            -- Nouveau message reçu d'un expert
    'message_urgent',              -- Message urgent d'un expert
    'message_response',            -- Réponse à une question
    
    -- Types spécifiques pour les rappels
    'deadline_reminder',           -- Rappel d'échéance
    'payment_reminder',            -- Rappel de paiement
    'validation_reminder'          -- Rappel de validation
));

-- Ajouter des commentaires pour documenter les types
COMMENT ON COLUMN public.Notification.notification_type IS 'Types de notifications supportés incluant les cas d''usage spécifiques clients';

-- Créer une fonction pour définir automatiquement l'expiration selon le type
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

-- Créer le trigger pour définir automatiquement l'expiration
DROP TRIGGER IF EXISTS trigger_set_notification_expiration ON public.Notification;
CREATE TRIGGER trigger_set_notification_expiration
    BEFORE INSERT ON public.Notification
    FOR EACH ROW
    EXECUTE FUNCTION set_notification_expiration();

-- Créer une fonction pour nettoyer les notifications expirées
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM public.Notification 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Créer un job pour nettoyer automatiquement (optionnel)
-- SELECT cron.schedule('cleanup-notifications', '0 2 * * *', 'SELECT cleanup_expired_notifications();');

-- Commentaires sur les nouveaux types
COMMENT ON TABLE public.Notification IS 'Système de notifications pour clients, experts et admins avec types spécifiques et expiration automatique'; 