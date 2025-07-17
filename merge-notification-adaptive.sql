-- Script de fusion adaptatif des tables notification
-- Date: 2025-01-03
-- Description: Fusion qui s'adapte aux structures réelles des tables

-- =====================================================
-- ÉTAPE 1: DIAGNOSTIC DES STRUCTURES
-- =====================================================

-- Vérifier les colonnes de la table notification (minuscule)
DO $$
DECLARE
    has_user_id boolean;
    has_user_type boolean;
    has_title boolean;
    has_message boolean;
    has_notification_type boolean;
    has_priority boolean;
    has_is_read boolean;
    has_read_at boolean;
    has_action_url boolean;
    has_action_data boolean;
    has_expires_at boolean;
    has_is_dismissed boolean;
    has_dismissed_at boolean;
    has_created_at boolean;
    has_updated_at boolean;
BEGIN
    -- Vérifier chaque colonne
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification' AND column_name = 'user_id'
    ) INTO has_user_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification' AND column_name = 'user_type'
    ) INTO has_user_type;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification' AND column_name = 'title'
    ) INTO has_title;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification' AND column_name = 'message'
    ) INTO has_message;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification' AND column_name = 'notification_type'
    ) INTO has_notification_type;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification' AND column_name = 'priority'
    ) INTO has_priority;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification' AND column_name = 'is_read'
    ) INTO has_is_read;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification' AND column_name = 'read_at'
    ) INTO has_read_at;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification' AND column_name = 'action_url'
    ) INTO has_action_url;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification' AND column_name = 'action_data'
    ) INTO has_action_data;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification' AND column_name = 'expires_at'
    ) INTO has_expires_at;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification' AND column_name = 'is_dismissed'
    ) INTO has_is_dismissed;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification' AND column_name = 'dismissed_at'
    ) INTO has_dismissed_at;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification' AND column_name = 'created_at'
    ) INTO has_created_at;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification' AND column_name = 'updated_at'
    ) INTO has_updated_at;
    
    -- Afficher le diagnostic
    RAISE NOTICE 'Diagnostic table notification:';
    RAISE NOTICE 'user_id: %', has_user_id;
    RAISE NOTICE 'user_type: %', has_user_type;
    RAISE NOTICE 'title: %', has_title;
    RAISE NOTICE 'message: %', has_message;
    RAISE NOTICE 'notification_type: %', has_notification_type;
    RAISE NOTICE 'priority: %', has_priority;
    RAISE NOTICE 'is_read: %', has_is_read;
    RAISE NOTICE 'read_at: %', has_read_at;
    RAISE NOTICE 'action_url: %', has_action_url;
    RAISE NOTICE 'action_data: %', has_action_data;
    RAISE NOTICE 'expires_at: %', has_expires_at;
    RAISE NOTICE 'is_dismissed: %', has_is_dismissed;
    RAISE NOTICE 'dismissed_at: %', has_dismissed_at;
    RAISE NOTICE 'created_at: %', has_created_at;
    RAISE NOTICE 'updated_at: %', has_updated_at;
END $$;

-- =====================================================
-- ÉTAPE 2: CRÉATION DE LA TABLE FINALE
-- =====================================================

-- Créer la table finale avec la structure complète
CREATE TABLE IF NOT EXISTS public.Notification_final (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (user_type IN ('client', 'expert', 'admin')),
    title VARCHAR(200) NOT NULL DEFAULT 'Notification',
    message TEXT NOT NULL DEFAULT '',
    notification_type VARCHAR(50) NOT NULL DEFAULT 'system',
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
-- ÉTAPE 3: MIGRATION ADAPTATIVE DES DONNÉES
-- =====================================================

-- Migrer les données de notification (minuscule) avec gestion des colonnes manquantes
INSERT INTO public.Notification_final (
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

-- Migrer les données de Notification (majuscule) si elle existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Notification') THEN
        INSERT INTO public.Notification_final (
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
        
        RAISE NOTICE 'Données migrées depuis la table Notification (majuscule)';
    ELSE
        RAISE NOTICE 'Table Notification (majuscule) n''existe pas, migration ignorée';
    END IF;
END $$;

-- =====================================================
-- ÉTAPE 4: SUPPRESSION ET RENOMMAGE
-- =====================================================

-- Supprimer les anciennes tables
DROP TABLE IF EXISTS public.notification CASCADE;
DROP TABLE IF EXISTS public."Notification" CASCADE;

-- Renommer la table finale
ALTER TABLE public.Notification_final RENAME TO "Notification";

-- =====================================================
-- ÉTAPE 5: CONFIGURATION FINALE
-- =====================================================

-- Créer les index
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
CREATE POLICY "Users can view their own notifications" ON public."Notification"
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own notifications" ON public."Notification"
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all notifications" ON public."Notification"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public."Admin" 
            WHERE "Admin".email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Créer les triggers
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

-- =====================================================
-- ÉTAPE 6: VÉRIFICATION FINALE
-- =====================================================

-- Vérifier le résultat
SELECT COUNT(*) as total_notifications FROM public."Notification";

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Notification'
ORDER BY ordinal_position; 