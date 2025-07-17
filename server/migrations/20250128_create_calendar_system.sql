-- =====================================================
-- MIGRATION : Système de Calendrier Avancé
-- Date : 2025-01-28
-- Description : Tables pour le calendrier avec événements collaboratifs et échéances d'étapes
-- =====================================================

-- ===== 1. TABLE DES ÉVÉNEMENTS CALENDRIER =====

CREATE TABLE IF NOT EXISTS "CalendarEvent" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('appointment', 'deadline', 'meeting', 'task', 'reminder')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    category VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (category IN ('client', 'expert', 'admin', 'system', 'collaborative')),
    
    -- Références aux entités existantes
    dossier_id UUID REFERENCES "ClientProduitEligible"(id) ON DELETE CASCADE,
    dossier_name VARCHAR(255),
    client_id UUID REFERENCES "Client"(id) ON DELETE CASCADE,
    expert_id UUID REFERENCES "Expert"(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Informations de localisation et réunion
    location TEXT,
    is_online BOOLEAN DEFAULT false,
    meeting_url TEXT,
    phone_number VARCHAR(20),
    
    -- Personnalisation
    color VARCHAR(7) DEFAULT '#3B82F6' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    
    -- Événements récurrents
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT, -- Format iCal RRULE
    
    -- Métadonnées
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT calendar_event_date_check CHECK (end_date > start_date)
);

-- ===== 2. TABLE DES PARTICIPANTS AUX ÉVÉNEMENTS =====

CREATE TABLE IF NOT EXISTS "CalendarEventParticipant" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES "CalendarEvent"(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'expert', 'admin')),
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    
    -- Statut de participation
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'tentative')),
    response_date TIMESTAMP WITH TIME ZONE,
    
    -- Notifications
    notified_at TIMESTAMP WITH TIME ZONE,
    reminder_sent BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte d'unicité
    CONSTRAINT calendar_event_participant_unique UNIQUE (event_id, user_id)
);

-- ===== 3. TABLE DES RAPPELS D'ÉVÉNEMENTS =====

CREATE TABLE IF NOT EXISTS "CalendarEventReminder" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES "CalendarEvent"(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'push', 'sms')),
    time_minutes INTEGER NOT NULL, -- Minutes avant l'événement
    sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 4. TABLE DES ÉTAPES DE DOSSIER =====

CREATE TABLE IF NOT EXISTS "DossierStep" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id UUID NOT NULL REFERENCES "ClientProduitEligible"(id) ON DELETE CASCADE,
    dossier_name VARCHAR(255) NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    step_type VARCHAR(20) NOT NULL CHECK (step_type IN ('validation', 'documentation', 'expertise', 'approval', 'payment')),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Statut et progression
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    
    -- Assignation
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assignee_name VARCHAR(255),
    assignee_type VARCHAR(20) CHECK (assignee_type IN ('client', 'expert', 'admin')),
    
    -- Durée et dépendances
    estimated_duration_minutes INTEGER DEFAULT 60,
    dependencies TEXT[], -- IDs des étapes dépendantes
    
    -- Métadonnées
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 5. TABLE DES PRÉFÉRENCES DE CALENDRIER =====

CREATE TABLE IF NOT EXISTS "CalendarPreferences" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Canaux de notification
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    in_app_notifications BOOLEAN DEFAULT true,
    
    -- Catégories activées
    categories JSONB DEFAULT '{"user": true, "system": true, "security": true, "business": true, "compliance": true}'::jsonb,
    
    -- Heures silencieuses
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    
    -- Fuseau horaire
    timezone VARCHAR(50) DEFAULT 'Europe/Paris',
    
    -- Paramètres d'affichage
    default_view VARCHAR(20) DEFAULT 'month' CHECK (default_view IN ('month', 'week', 'day', 'agenda')),
    working_hours_start TIME DEFAULT '09:00',
    working_hours_end TIME DEFAULT '18:00',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte d'unicité
    CONSTRAINT calendar_preferences_user_unique UNIQUE (user_id)
);

-- ===== 6. TABLE DES TEMPLATES D'ÉVÉNEMENTS =====

CREATE TABLE IF NOT EXISTS "CalendarEventTemplate" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('appointment', 'deadline', 'meeting', 'task', 'reminder')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    variables TEXT[], -- Variables disponibles dans le template
    category VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (category IN ('client', 'expert', 'admin', 'system', 'collaborative')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Configuration par défaut
    default_duration_minutes INTEGER DEFAULT 60,
    default_reminders JSONB DEFAULT '[{"type": "email", "time_minutes": 15}]'::jsonb,
    
    -- Métadonnées
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 7. TABLE DES LOGS D'ACTIVITÉ CALENDRIER =====

CREATE TABLE IF NOT EXISTS "CalendarActivityLog" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'expert', 'admin', 'system')),
    
    -- Action effectuée
    action VARCHAR(50) NOT NULL, -- 'create_event', 'update_event', 'delete_event', 'join_meeting', etc.
    resource_type VARCHAR(20) NOT NULL, -- 'event', 'step', 'reminder', 'template'
    resource_id UUID,
    
    -- Détails de l'action
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== INDEX POUR PERFORMANCE =====

-- Index pour CalendarEvent
CREATE INDEX IF NOT EXISTS idx_calendar_event_start_date ON "CalendarEvent"(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_event_end_date ON "CalendarEvent"(end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_event_type ON "CalendarEvent"(type);
CREATE INDEX IF NOT EXISTS idx_calendar_event_status ON "CalendarEvent"(status);
CREATE INDEX IF NOT EXISTS idx_calendar_event_category ON "CalendarEvent"(category);
CREATE INDEX IF NOT EXISTS idx_calendar_event_priority ON "CalendarEvent"(priority);
CREATE INDEX IF NOT EXISTS idx_calendar_event_dossier_id ON "CalendarEvent"(dossier_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_client_id ON "CalendarEvent"(client_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_expert_id ON "CalendarEvent"(expert_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_created_by ON "CalendarEvent"(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_event_date_range ON "CalendarEvent"(start_date, end_date);

-- Index pour CalendarEventParticipant
CREATE INDEX IF NOT EXISTS idx_calendar_participant_event_id ON "CalendarEventParticipant"(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_participant_user_id ON "CalendarEventParticipant"(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_participant_status ON "CalendarEventParticipant"(status);

-- Index pour CalendarEventReminder
CREATE INDEX IF NOT EXISTS idx_calendar_reminder_event_id ON "CalendarEventReminder"(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_reminder_sent ON "CalendarEventReminder"(sent);

-- Index pour DossierStep
CREATE INDEX IF NOT EXISTS idx_dossier_step_dossier_id ON "DossierStep"(dossier_id);
CREATE INDEX IF NOT EXISTS idx_dossier_step_due_date ON "DossierStep"(due_date);
CREATE INDEX IF NOT EXISTS idx_dossier_step_status ON "DossierStep"(status);
CREATE INDEX IF NOT EXISTS idx_dossier_step_priority ON "DossierStep"(priority);
CREATE INDEX IF NOT EXISTS idx_dossier_step_assignee_id ON "DossierStep"(assignee_id);

-- Index pour CalendarPreferences
CREATE INDEX IF NOT EXISTS idx_calendar_preferences_user_id ON "CalendarPreferences"(user_id);

-- Index pour CalendarEventTemplate
CREATE INDEX IF NOT EXISTS idx_calendar_template_type ON "CalendarEventTemplate"(type);
CREATE INDEX IF NOT EXISTS idx_calendar_template_category ON "CalendarEventTemplate"(category);

-- Index pour CalendarActivityLog
CREATE INDEX IF NOT EXISTS idx_calendar_activity_user_id ON "CalendarActivityLog"(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_activity_action ON "CalendarActivityLog"(action);
CREATE INDEX IF NOT EXISTS idx_calendar_activity_created_at ON "CalendarActivityLog"(created_at);

-- ===== FONCTIONS UTILITAIRES =====

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_calendar_event_updated_at
    BEFORE UPDATE ON "CalendarEvent"
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_updated_at();

CREATE TRIGGER update_dossier_step_updated_at
    BEFORE UPDATE ON "DossierStep"
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_updated_at();

CREATE TRIGGER update_calendar_preferences_updated_at
    BEFORE UPDATE ON "CalendarPreferences"
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_updated_at();

CREATE TRIGGER update_calendar_template_updated_at
    BEFORE UPDATE ON "CalendarEventTemplate"
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_updated_at();

-- Fonction pour créer des événements récurrents
CREATE OR REPLACE FUNCTION create_recurring_events(
    p_event_id UUID,
    p_recurrence_rule TEXT,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS VOID AS $$
DECLARE
    v_event "CalendarEvent"%ROWTYPE;
    v_current_date TIMESTAMP WITH TIME ZONE;
    v_new_event_id UUID;
BEGIN
    -- Récupérer l'événement original
    SELECT * INTO v_event FROM "CalendarEvent" WHERE id = p_event_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found: %', p_event_id;
    END IF;
    
    -- Logique pour créer les événements récurrents
    -- (Simplifiée - pourrait être étendue avec un parser RRULE complet)
    v_current_date := v_event.start_date + INTERVAL '1 week';
    
    WHILE v_current_date <= p_end_date LOOP
        INSERT INTO "CalendarEvent" (
            title, description, start_date, end_date, type, priority, status, category,
            dossier_id, dossier_name, client_id, expert_id, created_by, location,
            is_online, meeting_url, phone_number, color, is_recurring, recurrence_rule,
            metadata
        ) VALUES (
            v_event.title, v_event.description, v_current_date, 
            v_current_date + (v_event.end_date - v_event.start_date),
            v_event.type, v_event.priority, v_event.status, v_event.category,
            v_event.dossier_id, v_event.dossier_name, v_event.client_id, v_event.expert_id,
            v_event.created_by, v_event.location, v_event.is_online, v_event.meeting_url,
            v_event.phone_number, v_event.color, true, p_recurrence_rule, v_event.metadata
        ) RETURNING id INTO v_new_event_id;
        
        -- Copier les participants
        INSERT INTO "CalendarEventParticipant" (
            event_id, user_id, user_type, user_email, user_name, status
        )
        SELECT v_new_event_id, user_id, user_type, user_email, user_name, status
        FROM "CalendarEventParticipant"
        WHERE event_id = p_event_id;
        
        -- Copier les rappels
        INSERT INTO "CalendarEventReminder" (
            event_id, type, time_minutes
        )
        SELECT v_new_event_id, type, time_minutes
        FROM "CalendarEventReminder"
        WHERE event_id = p_event_id;
        
        v_current_date := v_current_date + INTERVAL '1 week';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===== VUES UTILITAIRES =====

-- Vue pour les événements avec participants
CREATE OR REPLACE VIEW "v_calendar_events_with_participants" AS
SELECT 
    ce.*,
    COUNT(cep.id) as participant_count,
    ARRAY_AGG(DISTINCT cep.user_name) FILTER (WHERE cep.user_name IS NOT NULL) as participant_names
FROM "CalendarEvent" ce
LEFT JOIN "CalendarEventParticipant" cep ON ce.id = cep.event_id
GROUP BY ce.id;

-- Vue pour les étapes de dossier avec assignation
CREATE OR REPLACE VIEW "v_dossier_steps_with_assignee" AS
SELECT 
    ds.*,
    cp.client_name,
    pe.nom as produit_nom,
    CASE 
        WHEN ds.due_date < NOW() AND ds.status != 'completed' THEN true
        ELSE false
    END as is_overdue
FROM "DossierStep" ds
LEFT JOIN "ClientProduitEligible" cpe ON ds.dossier_id = cpe.id
LEFT JOIN "Client" c ON cpe.client_id = c.id
LEFT JOIN "ProduitEligible" pe ON cpe.produit_eligible_id = pe.id;

-- Vue pour les événements du jour
CREATE OR REPLACE VIEW "v_today_events" AS
SELECT 
    ce.*,
    COUNT(cep.id) as participant_count
FROM "CalendarEvent" ce
LEFT JOIN "CalendarEventParticipant" cep ON ce.id = cep.event_id
WHERE DATE(ce.start_date) = CURRENT_DATE
    AND ce.status != 'cancelled'
GROUP BY ce.id
ORDER BY ce.start_date;

-- ===== DONNÉES INITIALES =====

-- Templates d'événements par défaut
INSERT INTO "CalendarEventTemplate" (name, type, title, message, variables, category, priority) VALUES
('Nouveau dossier', 'appointment', 'Nouveau dossier créé', 'Le client {clientName} a créé un nouveau dossier {productType}', ARRAY['clientName', 'productType'], 'business', 'medium'),
('Expert assigné', 'meeting', 'Expert assigné avec succès', 'L''expert {expertName} a été assigné au dossier {dossierId}', ARRAY['expertName', 'dossierId'], 'business', 'medium'),
('Échéance validation', 'deadline', 'Échéance de validation', 'Validation requise pour le dossier {dossierName} avant {dueDate}', ARRAY['dossierName', 'dueDate'], 'business', 'high'),
('Réunion client', 'meeting', 'Réunion avec le client', 'Réunion de suivi avec {clientName} pour le dossier {dossierName}', ARRAY['clientName', 'dossierName'], 'client', 'medium'),
('Rappel document', 'reminder', 'Document manquant', 'Document {documentType} manquant pour le dossier {dossierName}', ARRAY['documentType', 'dossierName'], 'system', 'medium');

-- ===== RLS (ROW LEVEL SECURITY) =====

-- Activer RLS sur toutes les tables
ALTER TABLE "CalendarEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CalendarEventParticipant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CalendarEventReminder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DossierStep" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CalendarPreferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CalendarEventTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CalendarActivityLog" ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour CalendarEvent
CREATE POLICY "Users can view their own events" ON "CalendarEvent"
    FOR SELECT USING (
        created_by = auth.uid() OR
        id IN (
            SELECT event_id FROM "CalendarEventParticipant" 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create events" ON "CalendarEvent"
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own events" ON "CalendarEvent"
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own events" ON "CalendarEvent"
    FOR DELETE USING (created_by = auth.uid());

-- Politiques RLS pour DossierStep
CREATE POLICY "Users can view dossier steps" ON "DossierStep"
    FOR SELECT USING (
        assignee_id = auth.uid() OR
        dossier_id IN (
            SELECT id FROM "ClientProduitEligible" 
            WHERE client_id IN (
                SELECT id FROM "Client" WHERE user_id = auth.uid()
            )
        )
    );

-- Politiques RLS pour CalendarPreferences
CREATE POLICY "Users can manage their own preferences" ON "CalendarPreferences"
    FOR ALL USING (user_id = auth.uid());

-- ===== COMMENTAIRES =====

COMMENT ON TABLE "CalendarEvent" IS 'Événements du calendrier avec support collaboratif et réunions en ligne';
COMMENT ON TABLE "CalendarEventParticipant" IS 'Participants aux événements calendrier';
COMMENT ON TABLE "CalendarEventReminder" IS 'Rappels automatiques pour les événements';
COMMENT ON TABLE "DossierStep" IS 'Étapes de workflow avec échéances et progression';
COMMENT ON TABLE "CalendarPreferences" IS 'Préférences utilisateur pour le calendrier';
COMMENT ON TABLE "CalendarEventTemplate" IS 'Templates pour créer des événements rapidement';
COMMENT ON TABLE "CalendarActivityLog" IS 'Logs d''activité pour audit et analytics';

-- ===== FIN DE MIGRATION =====

-- Vérification de la migration
DO $$
BEGIN
    RAISE NOTICE 'Migration Calendar System terminée avec succès!';
    RAISE NOTICE 'Tables créées: CalendarEvent, CalendarEventParticipant, CalendarEventReminder, DossierStep, CalendarPreferences, CalendarEventTemplate, CalendarActivityLog';
    RAISE NOTICE 'Index créés pour optimiser les performances';
    RAISE NOTICE 'RLS activé pour la sécurité';
    RAISE NOTICE 'Templates d''événements par défaut insérés';
END $$; 