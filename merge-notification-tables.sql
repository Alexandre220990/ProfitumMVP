-- Script de fusion des tables Notification et notification
-- Date: 2025-01-03
-- Description: Fusion des tables en préservant toutes les données

-- =====================================================
-- ÉTAPE 1: VÉRIFICATION DES STRUCTURES
-- =====================================================

-- Vérifier la structure de la table notification (minuscule)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notification'
ORDER BY ordinal_position;

-- Vérifier la structure de la table Notification (majuscule)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Notification'
ORDER BY ordinal_position;

-- Compter les données dans chaque table
SELECT 'notification (minuscule)' as table_name, COUNT(*) as row_count FROM notification
UNION ALL
SELECT 'Notification (majuscule)' as table_name, COUNT(*) as row_count FROM "Notification";

-- =====================================================
-- ÉTAPE 2: CRÉATION DE LA TABLE TEMPORAIRE
-- =====================================================

-- Créer une table temporaire avec la structure finale
CREATE TABLE IF NOT EXISTS public.Notification_temp (
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

-- =====================================================
-- ÉTAPE 3: MIGRATION DES DONNÉES
-- =====================================================

-- Migrer les données de notification (minuscule) vers Notification_temp
INSERT INTO public.Notification_temp (
    id,
    user_id,
    user_type,
    title,
    message,
    notification_type,
    priority,
    is_read,
    read_at,
    action_url,
    action_data,
    expires_at,
    is_dismissed,
    dismissed_at,
    created_at,
    updated_at
)
SELECT 
    id,
    user_id,
    COALESCE(user_type, 'client') as user_type,
    COALESCE(title, 'Notification') as title,
    COALESCE(message, '') as message,
    COALESCE(notification_type, 'system') as notification_type,
    COALESCE(priority, 'normal') as priority,
    COALESCE(is_read, false) as is_read,
    read_at,
    action_url,
    COALESCE(action_data, '{}'::jsonb) as action_data,
    expires_at,
    COALESCE(is_dismissed, false) as is_dismissed,
    dismissed_at,
    COALESCE(created_at, NOW()) as created_at,
    COALESCE(updated_at, NOW()) as updated_at
FROM public.notification
ON CONFLICT (id) DO NOTHING;

-- Migrer les données de Notification (majuscule) vers Notification_temp
INSERT INTO public.Notification_temp (
    id,
    user_id,
    user_type,
    title,
    message,
    notification_type,
    priority,
    is_read,
    read_at,
    action_url,
    action_data,
    expires_at,
    is_dismissed,
    dismissed_at,
    created_at,
    updated_at
)
SELECT 
    id,
    user_id,
    COALESCE(user_type, 'client') as user_type,
    COALESCE(title, 'Notification') as title,
    COALESCE(message, '') as message,
    COALESCE(notification_type, 'system') as notification_type,
    COALESCE(priority, 'normal') as priority,
    COALESCE(is_read, false) as is_read,
    read_at,
    action_url,
    COALESCE(action_data, '{}'::jsonb) as action_data,
    expires_at,
    COALESCE(is_dismissed, false) as is_dismissed,
    dismissed_at,
    COALESCE(created_at, NOW()) as created_at,
    COALESCE(updated_at, NOW()) as updated_at
FROM public."Notification"
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- ÉTAPE 4: SUPPRESSION DES ANCIENNES TABLES
-- =====================================================

-- Supprimer les anciennes tables
DROP TABLE IF EXISTS public.notification CASCADE;
DROP TABLE IF EXISTS public."Notification" CASCADE;

-- =====================================================
-- ÉTAPE 5: RENOMMAGE ET CONFIGURATION FINALE
-- =====================================================

-- Renommer la table temporaire
ALTER TABLE public.Notification_temp RENAME TO "Notification";

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notification_user_id ON public."Notification"(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_user_type ON public."Notification"(user_type);
CREATE INDEX IF NOT EXISTS idx_notification_type ON public."Notification"(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_is_read ON public."Notification"(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_priority ON public."Notification"(priority);
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON public."Notification"(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_expires_at ON public."Notification"(expires_at);
CREATE INDEX IF NOT EXISTS idx_notification_is_dismissed ON public."Notification"(is_dismissed);

-- Activer RLS
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
-- Utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their own notifications" ON public."Notification"
    FOR SELECT USING (user_id = auth.uid());

-- Utilisateurs peuvent gérer leurs propres notifications
CREATE POLICY "Users can manage their own notifications" ON public."Notification"
    FOR ALL USING (user_id = auth.uid());

-- Admins peuvent voir toutes les notifications
CREATE POLICY "Admins can view all notifications" ON public."Notification"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public."Admin" 
            WHERE "Admin".email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- =====================================================
-- ÉTAPE 6: CRÉATION DES TRIGGERS
-- =====================================================

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_updated_at
    BEFORE UPDATE ON public."Notification"
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
    BEFORE UPDATE ON public."Notification"
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
    BEFORE UPDATE ON public."Notification"
    FOR EACH ROW
    EXECUTE FUNCTION mark_notification_as_dismissed();

-- =====================================================
-- ÉTAPE 7: VÉRIFICATION FINALE
-- =====================================================

-- Vérifier le nombre total de notifications
SELECT COUNT(*) as total_notifications FROM public."Notification";

-- Vérifier la structure finale
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Notification'
ORDER BY ordinal_position;

-- Vérifier les politiques RLS
SELECT 
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'Notification';

-- Commentaires
COMMENT ON TABLE public."Notification" IS 'Système de notifications unifié pour clients, experts et admins';
COMMENT ON COLUMN public."Notification".user_id IS 'ID de l''utilisateur destinataire (référence auth.users)';
COMMENT ON COLUMN public."Notification".notification_type IS 'Type de notification avec cas d''usage spécifiques'; 