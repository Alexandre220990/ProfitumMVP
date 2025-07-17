-- Script de fusion adaptatif pour les tables Notification
-- Ce script gère les différences de colonnes entre les tables

-- Créer la fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_notification_final_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    -- Supprimer la table finale si elle existe
    DROP TABLE IF EXISTS public.Notification_final CASCADE;
    
    -- Créer la table finale avec la structure complète
    CREATE TABLE public.Notification_final (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        user_type VARCHAR NOT NULL DEFAULT 'client',
        title VARCHAR NOT NULL DEFAULT 'Notification',
        message TEXT NOT NULL DEFAULT '',
        notification_type VARCHAR NOT NULL DEFAULT 'system',
        priority VARCHAR DEFAULT 'normal',
        is_read BOOLEAN DEFAULT false,
        read_at TIMESTAMP WITH TIME ZONE,
        action_url TEXT,
        action_data JSONB DEFAULT '{}',
        expires_at TIMESTAMP WITH TIME ZONE,
        is_dismissed BOOLEAN DEFAULT false,
        dismissed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Insérer les données de la table "notification" (minuscule) - structure moderne
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
    FROM public.notification
    ON CONFLICT (id) DO NOTHING;

    -- Insérer les données de la table "Notification" (majuscule) - structure ancienne
    -- Mapping: recipient_id -> user_id, type_notification -> notification_type, etc.
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
        gen_random_uuid() as id, -- Générer un nouvel UUID car l'ancien est un integer
        recipient_id as user_id, -- Mapping: recipient_id -> user_id
        'client' as user_type, -- Valeur par défaut
        COALESCE(type_notification, 'Notification') as title, -- Mapping: type_notification -> title
        COALESCE(message, '') as message,
        COALESCE(type_notification, 'system') as notification_type, -- Mapping: type_notification -> notification_type
        'normal' as priority, -- Valeur par défaut
        NOT lu as is_read, -- Mapping: lu (boolean) -> is_read (inversé)
        CASE WHEN lu THEN date_notification ELSE NULL END as read_at, -- Si lu, utiliser date_notification
        NULL as action_url, -- Pas d'équivalent
        '{}'::jsonb as action_data, -- Valeur par défaut
        NULL as expires_at, -- Pas d'équivalent
        false as is_dismissed, -- Valeur par défaut
        NULL as dismissed_at, -- Pas d'équivalent
        COALESCE(date_notification, NOW()) as created_at, -- Mapping: date_notification -> created_at
        NOW() as updated_at
    FROM public."Notification"
    ON CONFLICT (id) DO NOTHING;

    -- Créer les index pour optimiser les performances
    CREATE INDEX idx_notification_final_user_id ON public.Notification_final(user_id);
    CREATE INDEX idx_notification_final_user_type ON public.Notification_final(user_type);
    CREATE INDEX idx_notification_final_is_read ON public.Notification_final(is_read);
    CREATE INDEX idx_notification_final_created_at ON public.Notification_final(created_at);
    CREATE INDEX idx_notification_final_notification_type ON public.Notification_final(notification_type);

    -- Créer le trigger pour mettre à jour updated_at automatiquement
    CREATE TRIGGER trigger_notification_final_updated_at
        BEFORE UPDATE ON public.Notification_final
        FOR EACH ROW
        EXECUTE FUNCTION update_notification_final_updated_at();

    -- Activer RLS (Row Level Security)
    ALTER TABLE public.Notification_final ENABLE ROW LEVEL SECURITY;

    -- Créer les politiques RLS
    -- Politique pour permettre aux utilisateurs de voir leurs propres notifications
    CREATE POLICY "Users can view their own notifications" ON public.Notification_final
        FOR SELECT USING (auth.uid()::text = user_id::text);

    -- Politique pour permettre aux utilisateurs de créer leurs propres notifications
    CREATE POLICY "Users can create their own notifications" ON public.Notification_final
        FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

    -- Politique pour permettre aux utilisateurs de mettre à jour leurs propres notifications
    CREATE POLICY "Users can update their own notifications" ON public.Notification_final
        FOR UPDATE USING (auth.uid()::text = user_id::text);

    -- Politique pour permettre aux utilisateurs de supprimer leurs propres notifications
    CREATE POLICY "Users can delete their own notifications" ON public.Notification_final
        FOR DELETE USING (auth.uid()::text = user_id::text);

    -- Politique pour les administrateurs (voir toutes les notifications)
    CREATE POLICY "Admins can view all notifications" ON public.Notification_final
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM public.authenticated_users 
                WHERE authenticated_users.id = auth.uid() 
                AND authenticated_users.user_type = 'admin'
            )
        );

    RAISE NOTICE 'Fusion terminée avec succès. Table Notification_final créée avec % enregistrements.', 
        (SELECT COUNT(*) FROM public.Notification_final);

END $$; 