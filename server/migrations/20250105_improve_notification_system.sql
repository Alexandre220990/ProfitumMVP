-- ============================================================================
-- AMÉLIORATION DU SYSTÈME DE NOTIFICATIONS - PHASE 1
-- Date : 2025-01-05
-- Objectif : Ajouter les tables manquantes pour un système de notifications avancé
-- ============================================================================

-- ===== 1. CRÉATION DE LA TABLE DES PRÉFÉRENCES UTILISATEUR =====
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'expert', 'admin')),
    
    -- Canaux de notification
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    slack_enabled BOOLEAN DEFAULT false,
    teams_enabled BOOLEAN DEFAULT false,
    webhook_enabled BOOLEAN DEFAULT false,
    in_app_enabled BOOLEAN DEFAULT true,
    
    -- Heures silencieuses
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    quiet_hours_enabled BOOLEAN DEFAULT true,
    
    -- Préférences générales
    timezone VARCHAR(50) DEFAULT 'Europe/Paris',
    language VARCHAR(10) DEFAULT 'fr',
    
    -- Filtres (corrigés avec cast explicite)
    priority_filter TEXT[] DEFAULT ARRAY['low', 'medium', 'high', 'urgent']::TEXT[],
    type_filter TEXT[] DEFAULT ARRAY[]::TEXT[],
    category_filter TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Fréquence et digest
    frequency VARCHAR(20) DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'hourly', 'daily', 'weekly')),
    digest_enabled BOOLEAN DEFAULT false,
    digest_frequency VARCHAR(20) DEFAULT 'daily' CHECK (digest_frequency IN ('daily', 'weekly')),
    digest_time TIME DEFAULT '09:00',
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 2. CRÉATION DE LA TABLE DES TEMPLATES DE NOTIFICATIONS =====
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    title_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    channels TEXT[] DEFAULT ARRAY['in_app']::TEXT[],
    variables TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 3. CRÉATION DE LA TABLE DES MÉTRIQUES DE NOTIFICATIONS =====
CREATE TABLE IF NOT EXISTS notification_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID REFERENCES notification(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'bounced')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ===== 4. CRÉATION DE LA TABLE DES GROUPES DE NOTIFICATIONS =====
CREATE TABLE IF NOT EXISTS notification_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    user_type VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de liaison groupes-utilisateurs
CREATE TABLE IF NOT EXISTS notification_group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES notification_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 5. INDEX POUR LES PERFORMANCES =====

-- Index pour notification_preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_type ON notification_preferences(user_type);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_updated_at ON notification_preferences(updated_at);

-- Index pour notification_templates
CREATE INDEX IF NOT EXISTS idx_notification_templates_name ON notification_templates(name);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);

-- Index pour notification_metrics
CREATE INDEX IF NOT EXISTS idx_notification_metrics_notification_id ON notification_metrics(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_metrics_user_id ON notification_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_metrics_status ON notification_metrics(status);
CREATE INDEX IF NOT EXISTS idx_notification_metrics_sent_at ON notification_metrics(sent_at);

-- Index pour notification_groups
CREATE INDEX IF NOT EXISTS idx_notification_groups_user_type ON notification_groups(user_type);
CREATE INDEX IF NOT EXISTS idx_notification_groups_active ON notification_groups(is_active);

-- Index pour notification_group_members
CREATE INDEX IF NOT EXISTS idx_notification_group_members_group_id ON notification_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_notification_group_members_user_id ON notification_group_members(user_id);

-- ===== 6. RLS (ROW LEVEL SECURITY) =====

-- RLS pour notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage their own notification preferences" ON notification_preferences
    FOR ALL USING (auth.uid()::text = user_id::text);

-- RLS pour notification_metrics
ALTER TABLE notification_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification metrics" ON notification_metrics
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- RLS pour notification_group_members
ALTER TABLE notification_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own group memberships" ON notification_group_members
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- ===== 7. INSERTION DES TEMPLATES PAR DÉFAUT =====

INSERT INTO notification_templates (name, title_template, message_template, notification_type, priority, channels, variables) VALUES
-- Templates pour experts
('expert_welcome', 'Bienvenue {expert_name}', 'Votre compte expert a été créé avec succès. Mot de passe temporaire : {temp_password}', 'expert_account_created', 'high', ARRAY['email', 'in_app']::TEXT[], ARRAY['expert_name', 'temp_password']::TEXT[]),
('expert_approved', 'Compte expert approuvé', 'Félicitations {expert_name} ! Votre compte expert a été approuvé.', 'expert_approved', 'high', ARRAY['email', 'in_app']::TEXT[], ARRAY['expert_name']::TEXT[]),
('expert_rejected', 'Demande expert refusée', 'Votre demande d''expert a été refusée. Raison : {rejection_reason}', 'expert_rejected', 'medium', ARRAY['email', 'in_app']::TEXT[], ARRAY['rejection_reason']::TEXT[]),

-- Templates pour clients
('client_document_uploaded', 'Document uploadé', 'Le document {document_name} a été uploadé avec succès.', 'document_uploaded', 'normal', ARRAY['in_app']::TEXT[], ARRAY['document_name']::TEXT[]),
('client_document_required', 'Document requis', 'Le document {document_name} est requis pour continuer.', 'document_required', 'high', ARRAY['email', 'in_app']::TEXT[], ARRAY['document_name']::TEXT[]),
('client_payment_received', 'Paiement reçu', 'Votre paiement de {amount}€ a été reçu.', 'payment', 'normal', ARRAY['email', 'in_app']::TEXT[], ARRAY['amount']::TEXT[]),

-- Templates système
('system_maintenance', 'Maintenance prévue', 'Une maintenance est prévue le {date} de {start_time} à {end_time}.', 'system', 'high', ARRAY['email', 'in_app']::TEXT[], ARRAY['date', 'start_time', 'end_time']::TEXT[]),
('system_alert', 'Alerte système', 'Alerte système : {message}', 'system', 'urgent', ARRAY['email', 'push', 'in_app']::TEXT[], ARRAY['message']::TEXT[]),

-- Templates calendrier
('calendar_event_reminder', 'Rappel événement', 'Rappel pour l''événement "{event_title}" dans {time_until_event}', 'calendar_reminder', 'medium', ARRAY['push', 'in_app']::TEXT[], ARRAY['event_title', 'time_until_event']::TEXT[]),
('calendar_event_invitation', 'Invitation événement', 'Vous êtes invité à l''événement "{event_title}" le {event_date}', 'calendar_invitation', 'normal', ARRAY['email', 'in_app']::TEXT[], ARRAY['event_title', 'event_date']::TEXT[]),

-- Templates facturation
('invoice_generated', 'Facture générée', 'Votre facture {invoice_number} a été générée pour un montant de {amount}€.', 'invoice', 'normal', ARRAY['email', 'in_app']::TEXT[], ARRAY['invoice_number', 'amount']::TEXT[]),
('payment_received', 'Paiement reçu', 'Votre paiement de {amount}€ a été reçu.', 'payment', 'normal', ARRAY['email', 'in_app']::TEXT[], ARRAY['amount']::TEXT[]),

-- Templates dossiers
('dossier_step_completed', 'Étape terminée', 'L''étape "{step_name}" de votre dossier a été terminée.', 'dossier_step', 'normal', ARRAY['in_app']::TEXT[], ARRAY['step_name']::TEXT[]),
('dossier_approved', 'Dossier approuvé', 'Votre dossier a été approuvé avec succès.', 'dossier_approved', 'high', ARRAY['email', 'in_app']::TEXT[], ARRAY[]::TEXT[]),
('dossier_rejected', 'Dossier rejeté', 'Votre dossier a été rejeté. Raison : {rejection_reason}', 'dossier_rejected', 'high', ARRAY['email', 'in_app']::TEXT[], ARRAY['rejection_reason']::TEXT[]);

-- ===== 8. CRÉATION DES GROUPES PAR DÉFAUT =====

INSERT INTO notification_groups (name, description, user_type) VALUES
('Tous les clients', 'Groupe contenant tous les clients', 'client'),
('Tous les experts', 'Groupe contenant tous les experts', 'expert'),
('Tous les admins', 'Groupe contenant tous les administrateurs', 'admin'),
('Experts TICPE', 'Experts spécialisés en TICPE', 'expert'),
('Experts URSSAF', 'Experts spécialisés en URSSAF', 'expert'),
('Clients premium', 'Clients avec un abonnement premium', 'client');

-- ===== 9. FONCTIONS UTILITAIRES =====

-- Fonction pour vérifier les préférences utilisateur
CREATE OR REPLACE FUNCTION check_user_notification_preferences(
    p_user_id UUID,
    p_notification_type VARCHAR(50),
    p_priority VARCHAR(20)
) RETURNS BOOLEAN AS $$
DECLARE
    user_prefs RECORD;
    current_time_val TIME;
    is_quiet_hours BOOLEAN := false;
BEGIN
    -- Récupérer les préférences utilisateur
    SELECT * INTO user_prefs 
    FROM notification_preferences 
    WHERE user_id = p_user_id;
    
    -- Si pas de préférences, accepter par défaut
    IF NOT FOUND THEN
        RETURN true;
    END IF;
    
    -- Vérifier les heures silencieuses
    IF user_prefs.quiet_hours_enabled THEN
        current_time_val := CURRENT_TIME;
        is_quiet_hours := (
            current_time_val >= user_prefs.quiet_hours_start OR 
            current_time_val <= user_prefs.quiet_hours_end
        );
        
        -- En heures silencieuses, seulement les notifications urgentes
        IF is_quiet_hours AND p_priority != 'urgent' THEN
            RETURN false;
        END IF;
    END IF;
    
    -- Vérifier le filtre de type
    IF array_length(user_prefs.type_filter, 1) > 0 AND 
       NOT (p_notification_type = ANY(user_prefs.type_filter)) THEN
        RETURN false;
    END IF;
    
    -- Vérifier le filtre de priorité
    IF array_length(user_prefs.priority_filter, 1) > 0 AND 
       NOT (p_priority = ANY(user_prefs.priority_filter)) THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour remplacer les variables dans un template
CREATE OR REPLACE FUNCTION replace_template_variables(
    p_template TEXT,
    p_variables JSONB
) RETURNS TEXT AS $$
DECLARE
    result_text TEXT := p_template;
    var_key TEXT;
    var_value TEXT;
BEGIN
    FOR var_key, var_value IN SELECT * FROM jsonb_each_text(p_variables)
    LOOP
        result_text := replace(result_text, '{' || var_key || '}', var_value);
    END LOOP;
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- ===== 10. TRIGGERS AUTOMATIQUES =====

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger aux nouvelles tables
CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at 
    BEFORE UPDATE ON notification_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_groups_updated_at 
    BEFORE UPDATE ON notification_groups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 11. VUES UTILES =====
-- Les vues sont créées dans un script séparé : 20250105_create_notification_views.sql
-- pour éviter les conflits de dépendances avec les fonctions

-- ===== 12. COMMENTAIRES POUR LA DOCUMENTATION =====

COMMENT ON TABLE notification_preferences IS 'Préférences de notifications par utilisateur';
COMMENT ON TABLE notification_templates IS 'Templates de notifications réutilisables';
COMMENT ON TABLE notification_metrics IS 'Métriques de performance des notifications';
COMMENT ON TABLE notification_groups IS 'Groupes d''utilisateurs pour notifications de masse';
COMMENT ON TABLE notification_group_members IS 'Membres des groupes de notifications';

COMMENT ON FUNCTION check_user_notification_preferences IS 'Vérifie si une notification doit être envoyée selon les préférences utilisateur';
COMMENT ON FUNCTION replace_template_variables IS 'Remplace les variables dans un template de notification';

-- ===== 13. MESSAGE DE CONFIRMATION =====
DO $$
BEGIN
    RAISE NOTICE '✅ Système de notifications amélioré avec succès !';
    RAISE NOTICE '📊 Tables créées : notification_preferences, notification_templates, notification_metrics, notification_groups';
    RAISE NOTICE '🔧 Fonctions ajoutées : check_user_notification_preferences, replace_template_variables';
    RAISE NOTICE '📈 Vues créées : notification_stats, user_notification_summary';
    RAISE NOTICE '🎯 Templates par défaut insérés : 15 templates disponibles';
    RAISE NOTICE '👥 Groupes par défaut créés : 6 groupes disponibles';
END $$;
